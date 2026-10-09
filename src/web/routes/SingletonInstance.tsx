import { toTitleCase } from "@elyukai/utils/string"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { FunctionalComponent } from "preact"
import {
  getSingletonInstanceByEntityName,
  updateSingletonInstanceByEntityName,
} from "../api/declarations.ts"
import {
  SingletonInstanceRouteSkeleton,
  type SingletonInstanceRouteSkeletonInitializer,
  type SingletonInstanceRouteSkeletonOnSaveHandler,
  type SingletonInstanceRouteSkeletonOnSubmitHandler,
  type SingletonInstanceRouteSkeletonSubmitHandler,
  type SingletonInstanceRouteSkeletonTitleBuilder,
} from "../components/SingletonInstanceRouteSkeleton.tsx"

const init: SingletonInstanceRouteSkeletonInitializer = async ({
  locales,
  entity,
  setInstanceContent,
}) => {
  try {
    const instanceData = await getSingletonInstanceByEntityName(locales, entity.name)
    setInstanceContent(instanceData.instance.content)
  } catch (error) {
    console.error("Error fetching entities:", error)
  }
}

const titleBuilder: SingletonInstanceRouteSkeletonTitleBuilder = ({ entity, instanceContent }) => {
  if (instanceContent) {
    return `${toTitleCase(entity.name)} — TSONDB`
  }

  return undefined
}

const submit: SingletonInstanceRouteSkeletonSubmitHandler<"saveandcontinue" | "save"> = async ({
  action,
  locales,
  entity,
  instanceContent,
  route,
  updateLocalGitState,
  setInstanceContent,
}) => {
  try {
    await updateSingletonInstanceByEntityName(locales, entity.name, {
      entityName: entity.name,
      content: instanceContent,
    })

    await updateLocalGitState?.()

    switch (action) {
      case "saveandcontinue": {
        setInstanceContent(instanceContent)
        break
      }
      case "save": {
        route(`/`)
        break
      }
      default:
        return assertExhaustive(action)
    }
  } catch (error) {
    if (error instanceof Error) {
      alert(`Error updating instance:\n\n${error}`)
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

export const SingletonInstance: FunctionalComponent = () => (
  <SingletonInstanceRouteSkeleton
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
