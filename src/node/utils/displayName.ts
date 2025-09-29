import { serializeEntityDecl, type EntityDecl } from "../../node/schema/index.ts"
import type { GetInstanceById } from "../../node/server/index.ts"
import {
  getSerializedDisplayNameFromEntityInstance,
  type DisplayNameResult,
} from "../../shared/utils/displayName.ts"

export const getDisplayNameFromEntityInstance = (
  entity: EntityDecl,
  instance: unknown,
  getInstanceById: GetInstanceById,
  locales: string[],
  defaultName: string = "",
  useCustomizer = true,
): DisplayNameResult => {
  if (useCustomizer && entity.displayNameCustomizer) {
    const calculatedName = getDisplayNameFromEntityInstance(
      entity,
      instance,
      getInstanceById,
      locales,
      defaultName,
      false,
    )

    return entity.displayNameCustomizer(
      instance as { [x: string]: unknown },
      calculatedName.name,
      calculatedName.localeId,
      id => getInstanceById(id)?.instance.content,
      id => {
        const result = getInstanceById(id)
        if (result) {
          const { entity, instance } = result
          return getDisplayNameFromEntityInstance(
            entity,
            instance.content,
            getInstanceById,
            locales,
            id,
          ).name
        } else {
          return undefined
        }
      },
      locales,
    )
  } else {
    return getSerializedDisplayNameFromEntityInstance(
      serializeEntityDecl(entity),
      instance,
      defaultName,
      locales,
    )
  }
}
