import { mkdir, writeFile } from "fs/promises"
import { dirname } from "path"
import { Schema } from "../../Schema.js"
import { Output } from "../Output.js"
import { TypeScriptRenderer } from "./TypeScriptRenderer.js"

export class TypeScriptOutput implements Output {
  targetPath: string
  renderer: TypeScriptRenderer

  constructor(options: {
    targetPath: string
    rendererOptions?: ConstructorParameters<typeof TypeScriptRenderer>[0]
  }) {
    this.targetPath = options.targetPath
    this.renderer = new TypeScriptRenderer(options.rendererOptions)
  }

  async run(schema: Schema): Promise<void> {
    await mkdir(dirname(this.targetPath), { recursive: true })
    await writeFile(this.targetPath, this.renderer.renderDeclarations([...schema.declarations]), {
      encoding: "utf-8",
    })
  }
}
