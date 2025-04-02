import { Declaration } from "./schema/declarations/Declaration.js"

export class Schema {
  declarations: Set<Declaration> = new Set()

  constructor(declarations: Declaration[]) {
    for (const decl of declarations) {
      this.addDeclaration(decl, true)
    }
    this.checkParameterNamesShadowing()
  }

  addDeclaration(decl: Declaration, nested = false): void {
    if (!this.declarations.has(decl)) {
      if (
        this.declarations
          .values()
          .some(otherDecl => otherDecl !== decl && otherDecl.name === decl.name)
      ) {
        throw new Error(
          `Duplicate declaration name: "${decl.name}". Make sure declaration names are globally unique.`,
        )
      } else {
        this.declarations.add(decl)
        if (nested) {
          for (const nestedDecl of decl.getNestedDeclarations()) {
            this.addDeclaration(nestedDecl)
          }
        }
      }
    }
  }

  checkParameterNamesShadowing(): void {
    for (const decl of this.declarations) {
      for (const param of decl.getParameterNames()) {
        if (this.declarations.values().some(decl => decl.name === param)) {
          throw new Error(`Parameter name "${param}" shadows declaration name.`)
        }
      }
    }
  }
}
