import { HTTPError } from "../../utils/error.ts"
import type {
  InstanceContainer,
  InstanceContainerOverview,
  InstanceContent,
} from "../../utils/instances.ts"
import { getValueAtKeyPath, type KeyPath } from "./keyPath.ts"

/**
 * The order in which instances of an entity are sorted in the editor. This affects entity details pages and reference options.
 * @default "displayName"
 */
export type SortOrder = "displayName" | { keyPath: KeyPath; isIndex?: boolean }
// | { entityMapKeyPath: KeyPath; keyPathInEntityMap: KeyPath }

const getSortOrderValue = (
  instanceContent: InstanceContent,
  sortOrder: Exclude<SortOrder, "displayName">,
): unknown => {
  if ("keyPath" in sortOrder) {
    return getValueAtKeyPath(instanceContent, sortOrder.keyPath)
  } else {
    // const entityMap = instance.getValueAtKeyPath(sortOrder.entityMapKeyPath)
    // if (entityMap && typeof entityMap === "object") {
    //   const nestedInstance = InstanceContent.fromUnknown(entityMap)
    //   return nestedInstance.getValueAtKeyPath(sortOrder.keyPathInEntityMap)
    // }
    return
  }
}

/**
 * An instance with all values needed for sorting.
 */
export type SortableInstance = [InstanceContainer, InstanceContainerOverview]

/**
 * Sorts instances according to the sort order defined for the entity.
 */
export const sortBySortOrder = <T extends SortableInstance>(
  instances: T[],
  sortOrder: SortOrder | undefined,
): T[] => {
  if (!sortOrder || sortOrder === "displayName") {
    return instances.toSorted((a, b) =>
      a[1].displayName.localeCompare(b[1].displayName, a[1].displayNameLocaleId, { numeric: true }),
    )
  } else {
    return instances
      .map(instance => ({
        instance,
        __sortOrderValue: getSortOrderValue(instance[0].content, sortOrder),
      }))
      .toSorted((a, b) =>
        typeof a.__sortOrderValue === "string" && typeof b.__sortOrderValue === "string"
          ? a.__sortOrderValue.localeCompare(b.__sortOrderValue, undefined, { numeric: true })
          : typeof a.__sortOrderValue === "number" && typeof b.__sortOrderValue === "number"
            ? a.__sortOrderValue - b.__sortOrderValue
            : String(a.__sortOrderValue).localeCompare(String(b.__sortOrderValue), undefined, {
                numeric: true,
              }),
      )
      .map(({ instance }) => instance)
  }
}

export const getSortOrderKeyPathForReorder = (decl: {
  name: string
  sortOrder?: SortOrder
}): KeyPath => {
  const { sortOrder } = decl

  if (isReorderableSortOrder(sortOrder)) {
    return sortOrder.keyPath
  } else {
    throw new HTTPError(
      400,
      `Declaration "${decl.name}" does not have the sort order defined correctly. Please check the validity of the whole schema as any incorrect configuration should have been caught during schema intialization.`,
    )
  }
}

export const isReorderableSortOrder = (
  sortOrder: SortOrder | undefined,
): sortOrder is {
  keyPath: KeyPath
  isIndex: true
} => typeof sortOrder === "object" && sortOrder.isIndex === true
