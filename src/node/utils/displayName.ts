import { serializeEntityDecl, type EntityDecl } from "../../node/schema/index.ts"
import type { GetInstanceById } from "../../node/server/index.ts"
import { getSerializedDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"

export const getDisplayNameFromEntityInstance = (
  entity: EntityDecl,
  instance: unknown,
  getInstanceById: GetInstanceById,
  locales: string[] = [],
  defaultName: string = "",
  useCustomizer = true,
): string => {
  if (useCustomizer && entity.displayNameCustomizer) {
    return entity.displayNameCustomizer(
      instance as { [x: string]: unknown },
      getDisplayNameFromEntityInstance(
        entity,
        instance,
        getInstanceById,
        locales,
        defaultName,
        false,
      ),
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
          )
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
