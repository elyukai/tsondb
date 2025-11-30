import type { GetInstanceById } from "../../node/server/index.ts"
import {
  getSerializedDisplayNameFromEntityInstance,
  type DisplayNameResult,
} from "../../shared/utils/displayName.ts"
import type { InstanceContainer, InstanceContent } from "../../shared/utils/instances.ts"
import { serializeEntityDecl, type EntityDecl } from "../schema/declarations/EntityDecl.ts"
import type { AsDeepType, Type } from "../schema/types/Type.ts"

export type GetChildInstancesForInstanceId = (
  parentEntityName: string,
  parentId: string,
  childEntityName: string,
) => { id: string; content: InstanceContent }[]

export type DisplayNameCustomizer<T extends Type> = (params: {
  instance: AsDeepType<T>
  instanceId: string
  instanceDisplayName: string
  instanceDisplayNameLocaleId: string | undefined
  locales: string[]
  getInstanceById: (id: string) => InstanceContent | undefined
  getDisplayNameForInstanceId: (id: string) => DisplayNameResult | undefined
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId
}) => DisplayNameResult

export const getDisplayNameFromEntityInstance = (
  entity: EntityDecl,
  instanceContainer: InstanceContainer,
  getInstanceById: GetInstanceById,
  getChildInstancesForInstanceId: GetChildInstancesForInstanceId,
  locales: string[],
  defaultName: string = "",
  useCustomizer = true,
): DisplayNameResult => {
  if (useCustomizer && entity.displayNameCustomizer) {
    const calculatedName = getDisplayNameFromEntityInstance(
      entity,
      instanceContainer,
      getInstanceById,
      getChildInstancesForInstanceId,
      locales,
      defaultName,
      false,
    )

    return entity.displayNameCustomizer({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment -- otherwise type instiatiation too deep
      instance: instanceContainer.content as any,
      instanceId: instanceContainer.id,
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
            instance,
            getInstanceById,
            getChildInstancesForInstanceId,
            locales,
            id,
          )
        } else {
          return undefined
        }
      },
      getChildInstancesForInstanceId,
    })
  } else {
    return getSerializedDisplayNameFromEntityInstance(
      serializeEntityDecl(entity),
      instanceContainer.content,
      defaultName,
      locales,
    )
  }
}
