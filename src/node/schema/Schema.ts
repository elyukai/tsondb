import Debug from "debug"
import type { Decl } from "./declarations/Declaration.ts"
import { getParameterNames, walkNodeTree } from "./declarations/Declaration.ts"
import type { EntityDecl } from "./declarations/EntityDecl.ts"
import { isEntityDecl } from "./declarations/EntityDecl.ts"
import { cases, isEnumDecl } from "./declarations/EnumDecl.ts"
import { getNestedDeclarations } from "./Node.ts"
import type { EnumCaseDecl } from "./types/generic/EnumType.ts"
import { isObjectType } from "./types/generic/ObjectType.ts"
import { isStringType } from "./types/primitives/StringType.ts"
import { isChildEntitiesType } from "./types/references/ChildEntitiesType.ts"
import { isIncludeIdentifierType } from "./types/references/IncludeIdentifierType.ts"
import { isNestedEntityMapType } from "./types/references/NestedEntityMapType.ts"
import {
  isReferenceIdentifierType,
  type ReferenceIdentifierType,
} from "./types/references/ReferenceIdentifierType.ts"
import { findTypeAtPath } from "./types/Type.ts"

const debug = Debug("tsondb:schema")

export interface Schema {
  declarations: readonly Decl[]
  localeEntity?: EntityDecl
}

const checkDuplicateIdentifier = (existingDecls: Decl[], decl: Decl) => {
  const existingDeclWithSameName = existingDecls
    .values()
    .find(
      otherDecl => otherDecl !== decl && otherDecl.name.toLowerCase() === decl.name.toLowerCase(),
    )

  if (existingDeclWithSameName) {
    throw new Error(
      `Duplicate declaration name "${decl.name}" in "${decl.sourceUrl}" and "${existingDeclWithSameName.sourceUrl}". Make sure declaration names are globally unique.`,
    )
  }
}

const checkParameterNamesShadowing = (decls: Decl[]) => {
  for (const decl of decls) {
    for (const param of getParameterNames(decl)) {
      walkNodeTree(node => {
        if (isIncludeIdentifierType(node) && node.reference.name === param) {
          throw new Error(
            `Parameter name "${param}" shadows declaration name in declaration "${decl.name}".`,
          )
        }
      }, decl)
    }
  }
}

const checkEntityDisplayNamePaths = (decls: Decl[], localeEntity?: EntityDecl) => {
  for (const decl of decls) {
    if (isEntityDecl(decl) && decl.displayName !== null) {
      const displayName = decl.displayName ?? "name"

      if (typeof displayName === "function") {
        continue
      } else if (typeof displayName === "object") {
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

const checkChildEntityTypeNotInEnumDecl = (checkedDecls: Set<Decl>, decl: Decl) => {
  if (!checkedDecls.has(decl)) {
    checkedDecls.add(decl)
    walkNodeTree(node => {
      if (isChildEntitiesType(node)) {
        throw new Error(
          `Child entities type for entity "${node.entity.name}" in declaration "${decl.name}" cannot be used inside an enum declaration.`,
        )
      } else if (isIncludeIdentifierType(node)) {
        checkChildEntityTypeNotInEnumDecl(checkedDecls, node.reference)
      }
    }, decl)
  }
}

const checkChildEntityTypeInEntityDecl = (
  checkedDecls: Set<Decl>,
  entityDecl: EntityDecl,
  decl: Decl,
) => {
  if (!checkedDecls.has(decl)) {
    checkedDecls.add(decl)
    walkNodeTree((node, parentTypes) => {
      if (isIncludeIdentifierType(node)) {
        checkChildEntityTypeInEntityDecl(checkedDecls, entityDecl, node.reference)
      } else if (isChildEntitiesType(node)) {
        if (!parentTypes.every(parentType => isObjectType(parentType))) {
          throw new Error(
            `Child entities type for entity "${node.entity.name}" in entity declaration "${entityDecl.name}" must be a constant child of the entity declaration, i.e. it must only be contained directly in the entity declaration or in nested object types.`,
          )
        }

        const backReferenceMemberDeclAtParent =
          node.entity.type.value.properties[node.entity.parentReferenceKey]

        if (backReferenceMemberDeclAtParent === undefined) {
          throw new Error(
            `Child entities type for entity "${node.entity.name}" in entity declaration "${entityDecl.name}" requires that the child entity has a reference to its parent defined.`,
          )
        }

        if (!backReferenceMemberDeclAtParent.isRequired) {
          throw new Error(
            `The parent reference "${node.entity.parentReferenceKey}" in child entity "${node.entity.name}" must be required.`,
          )
        }

        if (isReferenceIdentifierType(backReferenceMemberDeclAtParent.type)) {
          if (backReferenceMemberDeclAtParent.type.entity !== entityDecl) {
            throw new Error(
              `The parent reference "${node.entity.parentReferenceKey}" in child entity "${node.entity.name}" must reference the entity "${entityDecl.name}". If the parent entity is polymorphic, use an enum of reference identifier types instead.`,
            )
          }
        } else if (isIncludeIdentifierType(backReferenceMemberDeclAtParent.type)) {
          if (!isEnumDecl(backReferenceMemberDeclAtParent.type.reference)) {
            throw new Error(
              `The parent reference "${node.entity.parentReferenceKey}" in child entity "${node.entity.name}" must reference an enum declaration if it is an IncludeIdentifierType.`,
            )
          }

          const enumCases = cases(backReferenceMemberDeclAtParent.type.reference)

          if (
            !enumCases.every(
              (caseDecl): caseDecl is EnumCaseDecl<ReferenceIdentifierType> =>
                caseDecl.type !== null && isReferenceIdentifierType(caseDecl.type),
            )
          ) {
            throw new Error(
              `All cases of the enum "${backReferenceMemberDeclAtParent.type.reference.name}" referenced by the parent reference "${node.entity.parentReferenceKey}" in child entity "${node.entity.name}" must be ReferenceIdentifierTypes.`,
            )
          }

          if (!enumCases.some(caseDecl => caseDecl.type.entity === entityDecl)) {
            throw new Error(
              `At least one case of the enum "${backReferenceMemberDeclAtParent.type.reference.name}" referenced by the parent reference "${node.entity.parentReferenceKey}" in child entity "${node.entity.name}" must reference the entity "${decl.name}".`,
            )
          }
        } else {
          throw new Error(
            `The parent reference "${node.entity.parentReferenceKey}" in child entity "${node.entity.name}" must be either a ReferenceIdentifierType or an IncludeIdentifierType that references an enum declaration.`,
          )
        }
      }
    }, decl)
  }
}

const checkChildEntityTypes = (decls: Decl[]) => {
  for (const decl of decls) {
    if (isEnumDecl(decl)) {
      checkChildEntityTypeNotInEnumDecl(new Set<Decl>(), decl)
    }

    if (isEntityDecl(decl)) {
      checkChildEntityTypeInEntityDecl(new Set<Decl>(), decl, decl)
    }
  }
}

const checkChildEntitiesProvideCorrectPathToParentReferenceIdentifierType = (decls: Decl[]) => {
  for (const decl of decls) {
    if (isEntityDecl(decl) && decl.parentReferenceKey !== undefined) {
      const valueAtParentReferenceKey = decl.type.value.properties[decl.parentReferenceKey]
      if (valueAtParentReferenceKey) {
        const typeAtProperty = valueAtParentReferenceKey.type
        // the parent reference must either be an enum of reference types (for polymorphic relations) or a reference identifier type
        if (
          !(
            (isIncludeIdentifierType(typeAtProperty) &&
              isEnumDecl(typeAtProperty.reference) &&
              cases(typeAtProperty.reference).every(
                caseDecl => caseDecl.type !== null && isReferenceIdentifierType(caseDecl.type),
              )) ||
            isReferenceIdentifierType(typeAtProperty)
          )
        ) {
          throw new TypeError(
            `Parent reference key "${decl.parentReferenceKey}" in entity declaration "${decl.name}" must be an IncludeIdentifierType that references an enum declaration whose cases all have a ReferenceIdentifierType.`,
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
  debug("creating schema from %d declarations", declarations.length)
  debug("collecting nested declarations ...")
  const allDecls = addDeclarations(
    [],
    localeEntity ? declarations.concat(localeEntity) : declarations,
    true,
  )

  debug("checking name shadowing ...")
  checkParameterNamesShadowing(allDecls)
  debug("checking entity display name paths ...")
  checkEntityDisplayNamePaths(allDecls, localeEntity)
  debug("checking child entities ...")
  checkChildEntitiesProvideCorrectPathToParentReferenceIdentifierType(allDecls)
  debug("checking child entity types ...")
  checkChildEntityTypes(allDecls)

  debug("created schema, no integrity violations found")

  return {
    declarations: allDecls,
    localeEntity,
  }
}

export const getEntities = (schema: Schema): EntityDecl[] =>
  schema.declarations.filter(isEntityDecl)
