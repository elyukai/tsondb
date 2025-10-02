import { serializeEntityDecl, type EntityDecl } from "../../node/schema/index.ts"
import type { GetInstanceById } from "../../node/server/index.ts"
import {
  getSerializedDisplayNameFromEntityInstance,
  type DisplayNameResult,
} from "../../shared/utils/displayName.ts"

export type GetChildInstancesForInstanceId = (
  parentEntityName: string,
  parentId: string,
  childEntityName: string,
) => unknown[]

export const getDisplayNameFromEntityInstance = (
  entity: EntityDecl,
  instance: unknown,
  getInstanceById: GetInstanceById,
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId,
  locales: string[],
  defaultName: string = "",
  useCustomizer = true,
): DisplayNameResult => {
  if (useCustomizer && entity.displayNameCustomizer) {
    const calculatedName = getDisplayNameFromEntityInstance(
      entity,
      instance,
      getInstanceById,
      getChildInstancesForInstanceId,
      locales,
      defaultName,
      false,
    )

    return entity.displayNameCustomizer({
      instance: instance as { [x: string]: unknown },
      instanceDisplayName: calculatedName.name,
      instanceDisplayNameLocaleId: calculatedName.localeId,
      locales,
      getInstanceById: id => getInstanceById(id)?.instance.content,
      getDisplayNameForInstanceId: id => {
        const result = getInstanceById(id)
        if (result) {
          const { entity, instance } = result
          return getDisplayNameFromEntityInstance(
            entity,
            instance.content,
            getInstanceById,
            getChildInstancesForInstanceId,
            locales,
            id,
          ).name
        } else {
          return undefined
        }
      },
      getChildInstancesForInstanceId,
    })
  } else {
    return getSerializedDisplayNameFromEntityInstance(
      serializeEntityDecl(entity),
      instance,
      defaultName,
      locales,
    )
  }
}
