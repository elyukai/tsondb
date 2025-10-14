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
  type InstanceRouteSkeletonOnSaveHandler,
  type InstanceRouteSkeletonOnSubmitHandler,
  type InstanceRouteSkeletonSubmitHandler,
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

const submit: InstanceRouteSkeletonSubmitHandler<"saveandcontinue" | "save"> = async ({
  action,
  locales,
  entity,
  instanceId,
  instanceContent,
  childInstances,
  route,
  updateLocalGitState,
  setInstanceContent,
}) => {
  try {
    if (instanceId) {
      await updateInstanceByEntityNameAndId(locales, entity.name, instanceId, {
        childInstances,
        entityName: entity.name,
        content: instanceContent,
        id: instanceId,
      })

      await updateLocalGitState?.()

      switch (action) {
        case "saveandcontinue": {
          setInstanceContent(instanceContent)
          break
        }
        case "save": {
          route(`/entities/${entity.name}`)
          break
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(`Error updating instance:\n\n${error}`)
    }
  }
}

const onSubmit: InstanceRouteSkeletonOnSubmitHandler = async ({ buttonName, ...other }) => {
  if (buttonName === "save" || buttonName === "saveandcontinue") {
    await submit({ ...other, action: buttonName })
  }
}

const onSave: InstanceRouteSkeletonOnSaveHandler = other =>
  submit({ ...other, action: "saveandcontinue" })

export const Instance: FunctionalComponent = () => {
  return (
    <InstanceRouteSkeleton
      mode="edit"
      buttons={[
        { label: "Save", name: "save", primary: true },
        { label: "Save and continue", name: "saveandcontinue" },
      ]}
      init={init}
      titleBuilder={titleBuilder}
      onSubmit={onSubmit}
      onSave={onSave}
    />
  )
}
