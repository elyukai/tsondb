import Debug from "debug"
import {
  normalizeKeyPath,
  renderKeyPath,
  type KeyPath,
  type UniquingElement,
} from "../../shared/schema/declarations/EntityDecl.ts"
import { anySame } from "../../shared/utils/array.ts"
import { deepEqual } from "../../shared/utils/compare.ts"
import { assertExhaustive } from "../../shared/utils/typeSafety.ts"
import type { Decl } from "./declarations/Declaration.ts"
import { getParameterNames, walkNodeTree } from "./declarations/Declaration.ts"
import type { EntityDecl } from "./declarations/EntityDecl.ts"
import { isEntityDecl } from "./declarations/EntityDecl.ts"
import { cases, isEnumDecl } from "./declarations/EnumDecl.ts"
import { getNestedDeclarations, NodeKind, type NestedDecl, type Node } from "./Node.ts"
import type { EnumCaseDecl } from "./types/generic/EnumType.ts"
import { isObjectType, type ObjectType } from "./types/generic/ObjectType.ts"
import { isStringType } from "./types/primitives/StringType.ts"
import { isChildEntitiesType } from "./types/references/ChildEntitiesType.ts"
import { isIncludeIdentifierType } from "./types/references/IncludeIdentifierType.ts"
import { isNestedEntityMapType } from "./types/references/NestedEntityMapType.ts"
import {
  isReferenceIdentifierType,
  type ReferenceIdentifierType,
} from "./types/references/ReferenceIdentifierType.ts"
import { findTypeAtPath, type Type } from "./types/Type.ts"

const debug = Debug("tsondb:schema")

// const RESERVED_DECLARATION_IDENTIFIER = ["EntityMap", "StringableTranslationParameter"]

export interface Schema {
  declarations: readonly Decl[]
  localeEntity?: EntityDecl
}

const checkDuplicateIdentifier = (existingDecls: NestedDecl[], decl: NestedDecl) => {
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

// const checkReservedIdentifier = (decl: NestedDecl) => {
//   if (RESERVED_DECLARATION_IDENTIFIER.includes(decl.name)) {
//     throw new Error(
//       `Declaration "${decl.name}" in "${decl.sourceUrl}" uses a reserved identifier name.`,
//     )
//   }
// }

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

        const localeMapAtPath = findTypeAtPath(decl.type.value, pathToLocaleMap.split("."), {
          followTypeAliasIncludes: true,
        })

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
          { followTypeAliasIncludes: true },
        )

        if (!typeAtLocaleMapPath || !isStringType(typeAtLocaleMapPath)) {
          throw new Error(
            `Display name path "${pathInLocaleMap}" for entity "${decl.name}" does not lead to a value of type string in nested locale map.`,
          )
        }
      } else {
        const path = displayName.split(".")
        const typeAtPath = findTypeAtPath(decl.type.value, path, { followTypeAliasIncludes: true })
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

const checkChildEntityTypes = (localeEntity: EntityDecl | undefined, decls: Decl[]) => {
  if (localeEntity && localeEntity.parentReferenceKey !== undefined) {
    throw new TypeError(
      `The locale entity "${localeEntity.name}" cannot be used as a child entity to other entities.`,
    )
  }

  // TODO: Check that no cycles exist in child entity relations

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

const isDeclarationRecursive = (declToCheck: Decl): boolean => {
  const isDeclarationIncludedInNode = (visitedDecls: Decl[], node: Node): boolean => {
    switch (node.kind) {
      case NodeKind.EntityDecl:
      case NodeKind.EnumDecl:
      case NodeKind.TypeAliasDecl:
        return visitedDecls.includes(node)
          ? false
          : declToCheck === node ||
              isDeclarationIncludedInNode([...visitedDecls, node], node.type.value)
      case NodeKind.BooleanType:
      case NodeKind.DateType:
      case NodeKind.FloatType:
      case NodeKind.IntegerType:
      case NodeKind.StringType:
      case NodeKind.TypeArgumentType:
      case NodeKind.ReferenceIdentifierType:
      case NodeKind.TypeParameter:
      case NodeKind.ChildEntitiesType:
      case NodeKind.TranslationObjectType:
        return false
      case NodeKind.ArrayType:
        return isDeclarationIncludedInNode(visitedDecls, node.items)
      case NodeKind.ObjectType:
        return Object.entries(node.properties).some(([_, memberDecl]) =>
          isDeclarationIncludedInNode(visitedDecls, memberDecl.type),
        )
      case NodeKind.IncludeIdentifierType:
        return (
          declToCheck === node.reference ||
          isDeclarationIncludedInNode(visitedDecls, node.reference)
        )
      case NodeKind.NestedEntityMapType:
        return isDeclarationIncludedInNode(visitedDecls, node.type.value)
      case NodeKind.EnumType:
        return Object.entries(node.values).some(
          ([_, caseDecl]) =>
            caseDecl.type !== null && isDeclarationIncludedInNode(visitedDecls, caseDecl.type),
        )
      default:
        return assertExhaustive(node)
    }
  }

  return isDeclarationIncludedInNode([declToCheck], declToCheck.type.value)
}

const checkRecursiveGenericTypeAliasesAndEnumerationsAreOnlyParameterizedDirectlyInTypeAliases = (
  declarations: Decl[],
) => {
  const genericRecursiveDeclarations = declarations.filter(
    decl => isDeclarationRecursive(decl) && decl.parameters.length > 0,
  )

  for (const decl of declarations) {
    walkNodeTree((node, parentTypes) => {
      if (
        isIncludeIdentifierType(node) &&
        genericRecursiveDeclarations.includes(node.reference) &&
        decl !== node.reference
      ) {
        if (parentTypes.length > 0) {
          throw TypeError(
            `generic recursive type "${node.reference.name}", referenced in declaration "${decl.name}", may only be included as a direct descendant of a type alias. This is required for resolving generics for outputs without support for generics, as well as internal type validation.`,
          )
        }

        if (decl.parameters.length > 0) {
          throw TypeError(
            `generic recursive type "${node.reference.name}", referenced in declaration "${decl.name}", may only be included in a non-generic type alias. This is required for resolving generics for outputs without support for generics, as well as internal type validation.`,
          )
        }
      }
    }, decl)
  }
}

const getNodeAtKeyPath = (
  decl: EntityDecl,
  objectType: ObjectType,
  keyPath: KeyPath,
  parent?: string,
  parentPath: string[] = [],
): Type => {
  const [key, ...keyPathRest] = normalizeKeyPath(keyPath)
  if (key === undefined) {
    return objectType
  }

  const memberDecl = objectType.properties[key]

  if (memberDecl === undefined) {
    throw TypeError(
      `key "${key}"${parentPath.length === 0 ? "" : " in " + renderKeyPath(parentPath)} in unique constraint of entity "${decl.name}" does not exist in the entity`,
    )
  }

  const value = memberDecl.type
  const actualValue = isIncludeIdentifierType(value) ? value.reference.type.value : value

  if (keyPathRest.length > 0) {
    if (isObjectType(actualValue)) {
      return getNodeAtKeyPath(decl, actualValue, keyPathRest, parent, [...parentPath, key])
    }

    throw TypeError(
      `value at key "${key}"${parentPath.length === 0 ? "" : ' in "' + renderKeyPath(parentPath) + '"'}${parent ? " " + parent : ""} in unique constraint of entity "${decl.name}" does not contain an object type`,
    )
  }

  return value
}

const checkUniqueConstraintElement = (decl: EntityDecl, element: UniquingElement) => {
  if ("keyPath" in element) {
    getNodeAtKeyPath(decl, decl.type.value, element.keyPath)

    if (element.keyPathFallback !== undefined) {
      getNodeAtKeyPath(decl, decl.type.value, element.keyPathFallback)
    }
  } else {
    const entityMapType = getNodeAtKeyPath(decl, decl.type.value, element.entityMapKeyPath)

    if (!isNestedEntityMapType(entityMapType)) {
      throw TypeError(
        `value at key "${renderKeyPath(element.entityMapKeyPath)}" is not a nested entity map as required by the unique constraint of entity "${decl.name}"`,
      )
    }

    const nestedType = entityMapType.type.value
    const actualType = isIncludeIdentifierType(nestedType)
      ? nestedType.reference.type.value
      : nestedType

    getNodeAtKeyPath(
      decl,
      actualType,
      element.keyPathInEntityMap,
      `in entity map "${renderKeyPath(element.entityMapKeyPath)}"`,
    )

    if (element.keyPathInEntityMapFallback !== undefined) {
      getNodeAtKeyPath(
        decl,
        actualType,
        element.keyPathInEntityMapFallback,
        `in entity map "${renderKeyPath(element.entityMapKeyPath)}"`,
      )
    }
  }
}

const checkUniqueConstraints = (declarations: Decl[]) => {
  for (const decl of declarations) {
    if (isEntityDecl(decl)) {
      for (const constraint of decl.uniqueConstraints ?? []) {
        if (Array.isArray(constraint)) {
          for (const constraintPart of constraint) {
            checkUniqueConstraintElement(decl, constraintPart)
          }

          if (anySame(constraint, deepEqual)) {
            throw TypeError(
              `there are duplicate key descriptions in a combined constraint of entity "${decl.name}"`,
            )
          }
        } else {
          checkUniqueConstraintElement(decl, constraint)
        }
      }
    }
  }
}

const addDeclarations = (existingDecls: NestedDecl[], declsToAdd: NestedDecl[]): NestedDecl[] =>
  declsToAdd.reduce((accDecls, decl) => {
    if (!accDecls.includes(decl)) {
      return getNestedDeclarations(
        accDecls,
        decl.kind === "NestedEntity" ? decl.type : decl,
        undefined,
      )
    }

    return accDecls
  }, existingDecls)

export const Schema = (declarations: Decl[], localeEntity?: EntityDecl): Schema => {
  debug("creating schema from %d declarations", declarations.length)
  debug("collecting nested declarations ...")
  const allDecls = addDeclarations(
    [],
    localeEntity ? declarations.concat(localeEntity) : declarations,
  )
  debug("found %d nested declarations", allDecls.length)

  debug("checking for duplicate identifiers ...") // debug("checking for duplicate or reserved identifiers ...")
  allDecls.forEach((decl, declIndex) => {
    checkDuplicateIdentifier(allDecls.slice(0, declIndex), decl)
    // checkReservedIdentifier(decl)
  })

  const allDeclsWithoutNestedEntities = allDecls.filter(decl => decl.kind !== "NestedEntity")

  debug("checking name shadowing ...")
  checkParameterNamesShadowing(allDeclsWithoutNestedEntities)
  debug("checking entity display name paths ...")
  checkEntityDisplayNamePaths(allDeclsWithoutNestedEntities, localeEntity)
  debug("checking child entities ...")
  checkChildEntitiesProvideCorrectPathToParentReferenceIdentifierType(allDeclsWithoutNestedEntities)
  debug("checking child entity types ...")
  checkChildEntityTypes(localeEntity, allDeclsWithoutNestedEntities)
  debug("checking generic recursive types ...")
  checkRecursiveGenericTypeAliasesAndEnumerationsAreOnlyParameterizedDirectlyInTypeAliases(
    allDeclsWithoutNestedEntities,
  )
  debug("checking unique constraints ...")
  checkUniqueConstraints(allDeclsWithoutNestedEntities)

  debug("created schema, no integrity violations found")

  return {
    declarations: allDeclsWithoutNestedEntities,
    localeEntity,
  }
}

export const getEntities = (schema: Schema): EntityDecl[] =>
  schema.declarations.filter(isEntityDecl)
