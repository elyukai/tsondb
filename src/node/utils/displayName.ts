import { serializeEntityDecl, type EntityDecl } from "../../node/schema/index.ts"
import type { GetInstanceById } from "../../node/server/index.ts"
import { getSerializedDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"

export const getDisplayNameFromEntityInstance = (
  entity: EntityDecl,
  instance: unknown,
  defaultName: string,
  getInstanceById: GetInstanceById,
  locales: string[] = [],
  useCustomizer = true,
): string => {
  if (useCustomizer && entity.displayNameCustomizer) {
    return entity.displayNameCustomizer(
      instance as { [x: string]: unknown },
      getDisplayNameFromEntityInstance(
        entity,
        instance,
        defaultName,
        getInstanceById,
        locales,
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
            id,
            getInstanceById,
            locales,
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
