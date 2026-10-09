import { toTitleCase } from "@elyukai/utils/string"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { FunctionalComponent } from "preact"
import { createSingletonInstanceByEntityName } from "../api/declarations.ts"
import {
  SingletonInstanceRouteSkeleton,
  type SingletonInstanceRouteSkeletonInitializer,
  type SingletonInstanceRouteSkeletonOnSaveHandler,
  type SingletonInstanceRouteSkeletonOnSubmitHandler,
  type SingletonInstanceRouteSkeletonSubmitHandler,
  type SingletonInstanceRouteSkeletonTitleBuilder,
} from "../components/SingletonInstanceRouteSkeleton.tsx"
import { createTypeSkeleton } from "../utils/typeSkeleton.ts"

const init: SingletonInstanceRouteSkeletonInitializer = ({
  entity,
  setInstanceContent,
  getDeclFromDeclName,
}) => {
  setInstanceContent(createTypeSkeleton(getDeclFromDeclName, entity.type))
  return Promise.resolve()
}

const titleBuilder: SingletonInstanceRouteSkeletonTitleBuilder = ({ entity }) => {
  const entityName = entity.name
  return `New ${toTitleCase(entityName)} — TSONDB`
}

const submit: SingletonInstanceRouteSkeletonSubmitHandler<"saveandcontinue" | "save"> = async ({
  locales,
  entity,
  action,
  instanceContent,
  setInstanceContent,
  route,
  updateLocalGitState,
  reloadSingletonEntities,
}) => {
  try {
    const createdInstance = await createSingletonInstanceByEntityName(locales, entity.name, {
      entityName: entity.name,
      content: instanceContent,
    })

    await updateLocalGitState?.()
    await reloadSingletonEntities()

    switch (action) {
      case "saveandcontinue": {
        route(`/entities/${entity.name}/instance`)
        setInstanceContent(createdInstance.instance.content)
        break
      }
      case "save": {
        route(`/?created=${encodeURIComponent(entity.name)}`)
        break
      }
      default:
        return assertExhaustive(action)
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(`Error creating instance:\n\n${error.toString()}`)
    }
  }
}

const onSubmit: SingletonInstanceRouteSkeletonOnSubmitHandler = async ({
  buttonName,
  ...other
}) => {
  if (buttonName === "save" || buttonName === "saveandcontinue") {
    await submit({ ...other, action: buttonName })
  }
}

const onSave: SingletonInstanceRouteSkeletonOnSaveHandler = other =>
  submit({ ...other, action: "saveandcontinue" })

export const CreateSingletonInstance: FunctionalComponent = () => (
  <SingletonInstanceRouteSkeleton
    mode="create"
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
