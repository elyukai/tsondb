import {
  Decl,
  getNestedDeclarations,
  getParameterNames,
} from "./schema/declarations/Declaration.js"

export class Schema {
  declarations: Set<Decl> = new Set()

  constructor(declarations: Decl[]) {
    for (const decl of declarations) {
      this.addDeclaration(decl, true)
    }
    this.checkParameterNamesShadowing()
  }

  addDeclaration(decl: Decl, nested = false): void {
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
          for (const nestedDecl of getNestedDeclarations(decl)) {
            this.addDeclaration(nestedDecl)
          }
        }
      }
    }
  }

  checkParameterNamesShadowing(): void {
    for (const decl of this.declarations) {
      for (const param of getParameterNames(decl)) {
        if (this.declarations.values().some(decl => decl.name === param)) {
          throw new Error(`Parameter name "${param}" shadows declaration name.`)
        }
      }
    }
  }
}
