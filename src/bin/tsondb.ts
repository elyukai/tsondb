#!/usr/bin/env node

import Debug from "debug"
import { access, constants } from "node:fs/promises"
import { join } from "node:path"
import { cwd } from "node:process"
import { pathToFileURL } from "node:url"
import { parseArguments } from "simple-cli-args"
import {
  validateConfigForFormatting,
  validateConfigForGeneration,
  validateConfigForServer,
  validateConfigForTesting,
  type Config,
} from "../node/config.ts"
import type { ValidationOptions } from "../node/index.ts"
import { format, generateOutputs, serve, validate } from "../node/index.ts"
import { omitUndefinedKeys } from "../shared/utils/object.ts"

const debug = Debug("tsondb:cli")

const passedArguments = parseArguments({
  commands: {
    validate: {
      name: "validate",
      options: {
        checkReferentialIntegrity: {
          name: "check-referential-integrity",
          type: Boolean,
        },
        checkTranslationParameters: {
          name: "check-translation-parameters",
          type: Boolean,
        },
        checkOnlyEntities: {
          name: "entities",
          alias: "e",
          multiple: true,
          type: String,
        },
      },
    },
    generate: {
      name: "generate",
    },
    serve: {
      name: "serve",
    },
    format: {
      name: "format",
    },
  },
})

// import the config

const possibleConfigNames = [
  "tsondb.config.mts",
  "tsondb.config.ts",
  "tsondb.config.mjs",
  "tsondb.config.js",
]

const config: Config | undefined = await (async () => {
  for (const configName of possibleConfigNames) {
    const fullPath = join(cwd(), configName)

    try {
      await access(fullPath, constants.R_OK)
    } catch {
      debug(`could not use config file ${fullPath}, not found`)
      continue
    }

    const foundConfigModule = (await import(pathToFileURL(fullPath).toString())) as object
    if ("default" in foundConfigModule) {
      debug(`config file ${fullPath} found with config`)
      return foundConfigModule.default as Config
    } else {
      debug(`config file ${fullPath} found, but no default export present`)
    }
  }

  return undefined
})()

if (config === undefined) {
  throw new Error("No config file specified.")
}

if (passedArguments.command === undefined) {
  throw new Error(
    "No command has been specified. Possible commands are: generate, serve, validate.",
  )
}

switch (passedArguments.command.name) {
  case "generate":
    debug(`running command: generate`)
    validateConfigForGeneration(config)
    await generateOutputs(config.schema, config.outputs)
    break
  case "serve":
    debug(`running command: serve`)
    validateConfigForServer(config)
    await serve(
      config.schema,
      config.dataRootPath,
      config.defaultLocales,
      config.homeLayoutSections,
      config.serverOptions,
      config.validationOptions,
      config.customStylesheetPath,
    )
    break
  case "validate":
    debug(`running command: validate`)
    validateConfigForTesting(config)
    if (passedArguments.command.options?.checkReferentialIntegrity !== undefined) {
      debug(
        `check referential integrity: ${passedArguments.command.options.checkReferentialIntegrity ? "yes" : "no"}`,
      )
    }
    if (passedArguments.command.options?.checkOnlyEntities !== undefined) {
      const entities: string[] = passedArguments.command.options.checkOnlyEntities
      debug(`only check the following entities: ${entities.join(", ")}`)
    }
    await validate(config.schema, config.dataRootPath, {
      ...config.validationOptions,
      ...omitUndefinedKeys<Partial<ValidationOptions>>(passedArguments.command.options ?? {}),
    })
    break
  case "format":
    debug(`running command: format`)
    validateConfigForFormatting(config)
    await format(config.schema, config.dataRootPath)
    break
}
