#!/usr/bin/env node

import { omitUndefinedKeys } from "@elyukai/utils/object"
import Debug from "debug"
import { access, constants } from "node:fs/promises"
import { join } from "node:path"
import { cwd } from "node:process"
import { pathToFileURL } from "node:url"
import { parseArguments } from "simple-cli-args"
import {
  validateConfigForData,
  validateConfigForGeneration,
  validateConfigForServer,
  validateConfigForTesting,
  type Config,
} from "../node/config.ts"
import { TSONDB, type ValidationOptions } from "../node/index.ts"
import { createServer } from "../node/server/index.ts"

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

if (passedArguments.command.name === "generate") {
  debug(`running command: generate`)
  validateConfigForGeneration(config)
  await TSONDB.generateOutputs(config)
} else {
  validateConfigForData(config)
  const db = await TSONDB.create({
    ...config,
    validationOptions:
      passedArguments.command.name === "validate"
        ? {
            ...config.validationOptions,
            ...omitUndefinedKeys<Partial<ValidationOptions>>(passedArguments.command.options ?? {}),
          }
        : config.validationOptions,
  })
  switch (passedArguments.command.name) {
    case "serve":
      debug(`running command: serve`)
      validateConfigForServer(config)
      await createServer(
        db,
        config.homeLayoutSections,
        config.serverOptions,
        config.validationOptions,
        config.customStylesheetPath,
      )
      break
    case "validate": {
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
      const result = db.validate()
      if (!result) {
        process.exitCode = 1
      }
      break
    }
    case "format":
      debug(`running command: format`)
      await db.format()
      break
  }
}
