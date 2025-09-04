#!/usr/bin/env node

import Debug from "debug"
import { access, constants } from "node:fs/promises"
import { join } from "node:path"
import { cwd } from "node:process"
import { pathToFileURL } from "node:url"
import { parseArguments } from "simple-cli-args"
import { format, generateOutputs, serve, validate } from "../node/index.ts"
import type { Output } from "../node/renderers/Output.ts"
import type { Schema } from "../node/Schema.ts"
import type { ServerOptions } from "../node/server/index.ts"

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
        entities: {
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

export type Config = {
  serverOptions?: ServerOptions
  schema: Schema
  outputs: Output[]
  dataRootPath: string
}

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
      return foundConfigModule.default as Config | undefined
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
    await generateOutputs(config.schema, config.outputs)
    break
  case "serve":
    debug(`running command: serve`)
    await serve(config.schema, config.dataRootPath, config.serverOptions)
    break
  case "validate":
    debug(`running command: validate`)
    await validate(config.schema, config.dataRootPath, {
      checkReferentialIntegrity: passedArguments.command.options?.checkReferentialIntegrity,
      checkOnlyEntities: passedArguments.command.options?.entities,
    })
    break
  case "format":
    debug(`running command: format`)
    await format(config.schema, config.dataRootPath)
    break
}
