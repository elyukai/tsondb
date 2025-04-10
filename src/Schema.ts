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

  isDeclarationAdded(decl: Decl): boolean {
    return this.declarations.has(decl)
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
        if (nested) {
          const nestedDecls = getNestedDeclarations(this.isDeclarationAdded.bind(this), decl)
          this.declarations.add(decl)
          for (const nestedDecl of nestedDecls) {
            this.addDeclaration(nestedDecl)
          }
        } else {
          this.declarations.add(decl)
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
