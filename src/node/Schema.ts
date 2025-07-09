import type {
  Decl} from "./schema/declarations/Declaration.js";
import {
  getNestedDeclarations,
  getParameterNames,
} from "./schema/declarations/Declaration.js"
import type { EntityDecl} from "./schema/declarations/EntityDecl.js";
import { isEntityDecl } from "./schema/declarations/EntityDecl.js"
import { isStringType } from "./schema/types/primitives/StringType.js"
import { isNestedEntityMapType } from "./schema/types/references/NestedEntityMapType.js"
import { findTypeAtPath } from "./schema/types/Type.js"

export interface Schema {
  declarations: readonly Decl[]
  localeEntity?: EntityDecl
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

const checkEntityDisplayNamePaths = (decls: Decl[], localeEntity?: EntityDecl) => {
  for (const decl of decls) {
    if (isEntityDecl(decl)) {
      const displayName = decl.displayName ?? "name"

      if (typeof displayName === "object") {
        const pathToLocaleMap = displayName.pathToLocaleMap ?? "translations"
        const pathInLocaleMap = displayName.pathInLocaleMap ?? "name"

        if (localeEntity === undefined) {
          throw new Error(
            `Display name path "${pathToLocaleMap}" for entity "${decl.name}" requires a defined locale entity.`,
          )
        }

        const localeMapAtPath = findTypeAtPath(decl.type.value, pathToLocaleMap.split("."))

        if (
          !localeMapAtPath ||
          !isNestedEntityMapType(localeMapAtPath) ||
          localeMapAtPath.secondaryEntity.name !== localeEntity.name
        ) {
          throw new Error(
            `Display name path "${pathToLocaleMap}" for entity "${decl.name}" does not lead to a nested entity map for the defined locale entity.`,
          )
        }

        const typeAtLocaleMapPath = findTypeAtPath(
          localeMapAtPath.type.value,
          pathInLocaleMap.split("."),
        )

        if (!typeAtLocaleMapPath || !isStringType(typeAtLocaleMapPath)) {
          throw new Error(
            `Display name path "${pathInLocaleMap}" for entity "${decl.name}" does not lead to a value of type string in nested locale map.`,
          )
        }
      } else {
        const path = displayName.split(".")
        const typeAtPath = findTypeAtPath(decl.type.value, path)
        if (!typeAtPath || !isStringType(typeAtPath)) {
          throw new Error(
            `Display name path "${displayName}" for entity "${decl.name}" does not lead to a value of type string.`,
          )
        }
      }
    }
  }
}

const addDeclarations = (existingDecls: Decl[], declsToAdd: Decl[], nested: boolean): Decl[] =>
  declsToAdd.reduce((accDecls, decl) => {
    if (!accDecls.includes(decl)) {
      checkDuplicateIdentifier(accDecls, decl)
      const nestedDecls = nested ? getNestedDeclarations(accDecls, decl) : []
      return addDeclarations([...accDecls, decl], nestedDecls, false)
    }

    return accDecls
  }, existingDecls)

export const Schema = (declarations: Decl[], localeEntity?: EntityDecl): Schema => {
  const allDecls = addDeclarations(
    [],
    localeEntity ? declarations.concat(localeEntity) : declarations,
    true,
  )

  checkParameterNamesShadowing(allDecls)
  checkEntityDisplayNamePaths(allDecls, localeEntity)

  return {
    declarations: allDecls,
    localeEntity,
  }
}

export const getEntities = (schema: Schema): EntityDecl[] =>
  schema.declarations.filter(isEntityDecl)
