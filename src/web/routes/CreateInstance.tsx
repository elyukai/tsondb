import { toTitleCase } from "@elyukai/utils/string"
import type { FunctionalComponent } from "preact"
import { createInstanceByEntityNameAndId } from "../api/declarations.ts"
import {
  InstanceRouteSkeleton,
  type InstanceRouteSkeletonInitializer,
  type InstanceRouteSkeletonOnSaveHandler,
  type InstanceRouteSkeletonOnSubmitHandler,
  type InstanceRouteSkeletonSubmitHandler,
  type InstanceRouteSkeletonTitleBuilder,
} from "../components/InstanceRouteSkeleton.tsx"
import { createTypeSkeleton } from "../utils/typeSkeleton.ts"

const init: InstanceRouteSkeletonInitializer = ({
  entity,
  setInstanceContent,
  getDeclFromDeclName,
}) => {
  setInstanceContent(createTypeSkeleton(getDeclFromDeclName, entity.type))
  return Promise.resolve()
}

const titleBuilder: InstanceRouteSkeletonTitleBuilder = ({ entity }) => {
  const entityName = entity.name
  return "New " + toTitleCase(entityName) + " — TSONDB"
}

const submit: InstanceRouteSkeletonSubmitHandler<
  "saveandcontinue" | "saveandaddanother" | "save"
> = async ({
  locales,
  entity,
  action,
  instanceContent,
  isLocaleEntity,
  customId,
  childInstances,
  setInstanceContent,
  setCustomId,
  route,
  getDeclFromDeclName,
  updateLocalGitState,
}) => {
  try {
    const createdInstance = await createInstanceByEntityNameAndId(
      locales,
      entity.name,
      {
        childInstances,
        entityName: entity.name,
        content: instanceContent,
        id: undefined,
      },
      isLocaleEntity ? customId : undefined,
    )

    await updateLocalGitState?.()

    switch (action) {
      case "saveandcontinue": {
        route(`/entities/${entity.name}/instances/${createdInstance.instance.id}`)
        setInstanceContent(createdInstance.instance.content)
        break
      }
      case "saveandaddanother": {
        setInstanceContent(createTypeSkeleton(getDeclFromDeclName, entity.type))
        setCustomId("")
        alert(
          `Instance of entity ${entity.name} created successfully with identifier ${createdInstance.instance.id}. You can add another instance now.`,
        )
        break
      }
      case "save": {
        route(`/entities/${entity.name}?created=${encodeURIComponent(createdInstance.instance.id)}`)
        break
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(`Error creating instance:\n\n${error.toString()}`)
    }
  }
}

const onSubmit: InstanceRouteSkeletonOnSubmitHandler = async ({ buttonName, ...other }) => {
  if (
    buttonName === "save" ||
    buttonName === "saveandcontinue" ||
    buttonName === "saveandaddanother"
  ) {
    await submit({ ...other, action: buttonName })
  }
}

const onSave: InstanceRouteSkeletonOnSaveHandler = other =>
  submit({ ...other, action: "saveandcontinue" })

export const CreateInstance: FunctionalComponent = () => (
  <InstanceRouteSkeleton
    mode="create"
    buttons={[
      { label: "Save", name: "save", primary: true },
      { label: "Save and continue", name: "saveandcontinue" },
      { label: "Save and add another", name: "saveandaddanother" },
    ]}
    init={init}
    titleBuilder={titleBuilder}
    onSubmit={onSubmit}
    onSave={onSave}
  />
)
