import { Output } from "./renderers/Output.js"
import { Schema } from "./Schema.js"
import { Declaration } from "./schema/declarations/Declaration.js"

export class ModelContainer {
  schema: Schema
  outputs: Output[]

  constructor(args: Declaration[] | { schema: Schema; outputs: Output[] }) {
    if (Array.isArray(args)) {
      this.schema = new Schema(args)
      this.outputs = []
    } else {
      this.schema = args.schema
      this.outputs = args.outputs
    }
  }

  async run(): Promise<void> {
    for (const output of this.outputs) {
      await output.run(this.schema)
    }
  }
}
