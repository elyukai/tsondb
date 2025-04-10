import {
  Decl,
  getNestedDeclarations,
  getParameterNames,
} from "./schema/declarations/Declaration.js"

export interface Schema {
  declarations: readonly Decl[]
}

const checkDuplicateIdentifier = (existingDecls: Decl[], decl: Decl) => {
  if (
    existingDecls
      .values()
      .some(
        otherDecl => otherDecl !== decl && otherDecl.name.toLowerCase() === decl.name.toLowerCase(),
      )
  ) {
    throw new Error(
      `Duplicate declaration name: "${decl.name}". Make sure declaration names are globally unique.`,
    )
  }
}

const checkParameterNamesShadowing = (decls: Decl[]) => {
  for (const decl of decls) {
    for (const param of getParameterNames(decl)) {
      if (decls.values().some(decl => decl.name === param)) {
        throw new Error(`Parameter name "${param}" shadows declaration name.`)
      }
    }
  }
}

const addDeclarations = (existingDecls: Decl[], declsToAdd: Decl[], nested: boolean): Decl[] =>
  declsToAdd.reduce((accDecls, decl) => {
    if (!existingDecls.includes(decl)) {
      checkDuplicateIdentifier(existingDecls, decl)
      const nestedDecls = nested
        ? getNestedDeclarations(declToAdd => existingDecls.includes(declToAdd), decl)
        : []
      return addDeclarations([...existingDecls, decl], nestedDecls, false)
    }

    return accDecls
  }, existingDecls)

export const Schema = (declarations: Decl[]): Schema => {
  const allDecls = addDeclarations([], declarations, true)
  checkParameterNamesShadowing(allDecls)

  return {
    declarations: allDecls,
  }
}
