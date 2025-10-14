import type { FunctionalComponent } from "preact"
import { toTitleCase } from "../../shared/utils/string.ts"
import { createInstanceByEntityNameAndId } from "../api/declarations.ts"
import {
  InstanceRouteSkeleton,
  type InstanceRouteSkeletonInitializer,
  type InstanceRouteSkeletonOnSubmitHandler,
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

const onSubmit: InstanceRouteSkeletonOnSubmitHandler = async ({
  locales,
  entity,
  buttonName,
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
    if (buttonName) {
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

      switch (buttonName) {
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
          route(
            `/entities/${entity.name}?created=${encodeURIComponent(createdInstance.instance.id)}`,
          )
          break
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(`Error creating instance:\n\n${error.toString()}`)
    }
  }
}

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
  />
)
