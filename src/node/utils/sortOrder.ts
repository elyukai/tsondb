import type { Lazy } from "@elyukai/utils/lazy"
import {
  getSortOrderKeyPathForReorder,
  type SortOrder,
} from "../../shared/schema/utils/sortOrder.ts"
import type { IntegerType, Type } from "../schema/dsl/index.ts"
import { findTypeAtPath } from "../schema/helpers.ts"

export const getSortOrderType = (decl: {
  name: string
  type: Lazy<Type>
  sortOrder?: SortOrder
}): IntegerType => {
  const keyPath = getSortOrderKeyPathForReorder(decl)
  return findTypeAtPath(decl.type.value, keyPath, { throwOnPathMismatch: true }) as IntegerType
}

export const getSortOrderStartIndex = (decl: {
  name: string
  type: Lazy<Type>
  sortOrder?: SortOrder
}): number => {
  const sortOrderType = getSortOrderType(decl)
  return typeof sortOrderType.minimum === "number"
    ? sortOrderType.minimum
    : (sortOrderType.minimum?.value ?? 0)
}
