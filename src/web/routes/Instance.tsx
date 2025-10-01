import type { FunctionalComponent } from "preact"
import { getSerializedDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"
import { toTitleCase } from "../../shared/utils/string.ts"
import {
  getInstanceByEntityNameAndId,
  updateInstanceByEntityNameAndId,
} from "../api/declarations.ts"
import {
  InstanceRouteSkeleton,
  type InstanceRouteSkeletonInitializer,
  type InstanceRouteSkeletonOnSubmitHandler,
  type InstanceRouteSkeletonTitleBuilder,
} from "../components/InstanceRouteSkeleton.tsx"

const init: InstanceRouteSkeletonInitializer = async ({
  locales,
  entity,
  instanceId,
  setInstanceContent,
}) => {
  if (instanceId) {
    try {
      const instanceData = await getInstanceByEntityNameAndId(locales, entity.name, instanceId)
      setInstanceContent(instanceData.instance.content)
    } catch (error) {
      console.error("Error fetching entities:", error)
    }
  }
}

const titleBuilder: InstanceRouteSkeletonTitleBuilder = ({
  locales,
  entity,
  instanceId,
  instanceContent,
}) => {
  if (instanceContent && instanceId) {
    const instanceName = getSerializedDisplayNameFromEntityInstance(
      entity,
      instanceContent,
      instanceId,
      locales,
    ).name
    return instanceName + " — " + toTitleCase(entity.name) + " — TSONDB"
  }

  return undefined
}

const onSubmit: InstanceRouteSkeletonOnSubmitHandler = async ({
  locales,
  entity,
  instanceId,
  instanceContent,
  buttonName,
  childInstances,
}) => {
  if (instanceId && buttonName === "save") {
    try {
      await updateInstanceByEntityNameAndId(locales, entity.name, instanceId, {
        childInstances,
        entityName: entity.name,
        content: instanceContent,
        id: instanceId,
      })
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error updating instance:\n\n${error}`)
      }
    }
  }
}

export const Instance: FunctionalComponent = () => {
  return (
    <InstanceRouteSkeleton
      mode="edit"
      init={init}
      titleBuilder={titleBuilder}
      onSubmit={onSubmit}
    />
  )
}
