import { Declaration } from "./schema/declarations/Declaration.js"

export class Schema {
  entities: Set<Declaration>

  constructor() {
    this.entities = new Set()
  }

  register(entity: Declaration): Schema {
    if (!this.entities.has(entity)) {
      this.entities.add(entity)
      for (const nestedDecl of entity.getNestedDeclarations()) {
        if (!this.entities.has(nestedDecl)) {
          this.entities.add(nestedDecl)
        }
      }
    }

    return this
  }
}
