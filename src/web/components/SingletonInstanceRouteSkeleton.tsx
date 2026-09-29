import { deepEqual } from "@elyukai/utils/equality"
import { constant } from "@elyukai/utils/function"
import { toTitleCase } from "@elyukai/utils/string"
import type { FunctionalComponent } from "preact"
import { useLocation, useRoute, type LocationHook } from "preact-iso"
import type { SetStateAction } from "preact/compat"
import { useCallback, useContext, useEffect, useMemo, useState, type Dispatch } from "preact/hooks"
import type { GetDeclFromDeclName } from "../../shared/schema/declarations/Declaration.ts"
import type { SerializedSingletonEntityDecl } from "../../shared/schema/declarations/SingletonEntityDecl.ts"
import type { InstanceContent } from "../../shared/utils/instances.ts"
import { deleteSingletonInstanceByEntityName } from "../api/declarations.ts"
import { SingletonEntitiesContext } from "../context/entities.ts"
import { GitClientContext } from "../context/gitClient.ts"
import { useSingletonEntityFromRoute } from "../hooks/useEntityFromRoute.ts"
import { useInstanceNamesByEntity } from "../hooks/useInstanceNamesByEntity.ts"
import { useGetDeclFromDeclName } from "../hooks/useSecondaryDeclarations.ts"
import { useSetting } from "../hooks/useSettings.ts"
import { homeTitle } from "../routes/Home.tsx"
import { NotFound } from "../routes/NotFound.tsx"
import { runWithLoading } from "../signals/loading.ts"
import { Layout } from "./Layout.tsx"
import { TypeInput } from "./typeInputs/TypeInput.tsx"

export type SingletonInstanceRouteSkeletonInitializer = (values: {
  locales: string[]
  entity: SerializedSingletonEntityDecl
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  getDeclFromDeclName: GetDeclFromDeclName
}) => Promise<void>

export type SingletonInstanceRouteSkeletonSubmitHandler<A extends string = string> = (values: {
  locales: string[]
  entity: SerializedSingletonEntityDecl
  instanceContent: InstanceContent
  action: A
  route: LocationHook["route"]
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  getDeclFromDeclName: GetDeclFromDeclName
  updateLocalGitState?: () => Promise<void>
  reloadSingletonEntities: () => Promise<void>
}) => Promise<void>

export type SingletonInstanceRouteSkeletonOnSubmitHandler = (values: {
  locales: string[]
  entity: SerializedSingletonEntityDecl
  instanceContent: InstanceContent
  buttonName: string | undefined
  route: LocationHook["route"]
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  getDeclFromDeclName: GetDeclFromDeclName
  updateLocalGitState?: () => Promise<void>
  reloadSingletonEntities: () => Promise<void>
}) => Promise<void>

export type SingletonInstanceRouteSkeletonOnSaveHandler = (values: {
  locales: string[]
  entity: SerializedSingletonEntityDecl
  instanceContent: InstanceContent
  route: LocationHook["route"]
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  getDeclFromDeclName: GetDeclFromDeclName
  updateLocalGitState?: () => Promise<void>
  reloadSingletonEntities: () => Promise<void>
}) => Promise<void>

export type SingletonInstanceRouteSkeletonTitleBuilder = (values: {
  locales: string[]
  entity: SerializedSingletonEntityDecl
  instanceContent: InstanceContent | undefined
}) => string | undefined

type Props = {
  mode: "create" | "edit"
  buttons: { label: string; name: string; primary?: boolean }[]
  init: SingletonInstanceRouteSkeletonInitializer
  titleBuilder: SingletonInstanceRouteSkeletonTitleBuilder
  onSubmit: SingletonInstanceRouteSkeletonOnSubmitHandler
  onSave: SingletonInstanceRouteSkeletonOnSaveHandler
}

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- best practice according to MDN
  event.returnValue = "unsaved changes"
}

const applePlatformPattern = /(Mac|iPhone|iPod|iPad)/i

const isApplePlatform = () => applePlatformPattern.test(window.navigator.platform)

const checkCmdOrCtrl = (event: KeyboardEvent) => (isApplePlatform() ? event.metaKey : event.ctrlKey)

export const SingletonInstanceRouteSkeleton: FunctionalComponent<Props> = ({
  mode,
  buttons,
  init,
  titleBuilder,
  onSubmit,
  onSave,
}) => {
  const {
    params: { name },
  } = useRoute()

  const [locales] = useSetting("displayedLocales")
  const [getDeclFromDeclName, declsLoaded] = useGetDeclFromDeclName()
  const { declaration: entity } = useSingletonEntityFromRoute() ?? {}
  const [instanceNamesByEntity] = useInstanceNamesByEntity()
  const [instanceContent, setInstanceContent] = useState<InstanceContent>()
  const [savedInstanceContent, setSavedInstanceContent] = useState<unknown>()
  const client = useContext(GitClientContext)
  const { reloadSingletonEntities } = useContext(SingletonEntitiesContext)

  const { route } = useLocation()

  const hasUnsavedChanges = useMemo(
    () => !deepEqual(instanceContent, savedInstanceContent),
    [instanceContent, savedInstanceContent],
  )

  const saveHandler = useCallback(
    (event: KeyboardEvent) => {
      if (checkCmdOrCtrl(event) && event.key === "s" && entity && instanceContent !== undefined) {
        event.preventDefault()
        runWithLoading(() =>
          onSave({
            locales,
            entity,
            instanceContent,
            route,
            getDeclFromDeclName,
            setInstanceContent: value => {
              setInstanceContent(value)
              setSavedInstanceContent(value)
            },
            updateLocalGitState: client?.updateLocalState,
            reloadSingletonEntities,
          }),
        ).catch((error: unknown) => {
          console.error("Error submitting instance data:", error)
        })
      }
    },
    [
      client?.updateLocalState,
      entity,
      getDeclFromDeclName,
      instanceContent,
      locales,
      onSave,
      route,
      reloadSingletonEntities,
    ],
  )

  useEffect(() => {
    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", onBeforeUnload)
    } else {
      window.removeEventListener("beforeunload", onBeforeUnload)
    }

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (hasUnsavedChanges) {
      window.addEventListener("keydown", saveHandler)
    } else {
      window.removeEventListener("keydown", saveHandler)
    }

    return () => {
      window.removeEventListener("keydown", saveHandler)
    }
  }, [hasUnsavedChanges, saveHandler])

  useEffect(() => {
    document.title =
      (entity && titleBuilder({ locales, entity, instanceContent })) ?? "Not found — TSONDB"
  }, [entity, instanceContent, locales, titleBuilder])

  useEffect(() => {
    if (entity && instanceContent === undefined && declsLoaded) {
      runWithLoading(() =>
        init({
          locales,
          entity,
          setInstanceContent: value => {
            setInstanceContent(value)
            setSavedInstanceContent(value)
          },
          getDeclFromDeclName,
        }),
      ).catch((error: unknown) => {
        console.error("Error initializing instance route skeleton:", error)
      })
    }
  }, [entity, declsLoaded, getDeclFromDeclName, init, instanceContent, locales, name])

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (entity && instanceContent !== undefined) {
      const buttonName = event.submitter?.getAttribute("name") ?? undefined
      runWithLoading(() =>
        onSubmit({
          locales,
          entity,
          instanceContent,
          buttonName,
          route,
          getDeclFromDeclName,
          setInstanceContent: value => {
            setInstanceContent(value)
            setSavedInstanceContent(value)
          },
          updateLocalGitState: client?.updateLocalState,
          reloadSingletonEntities,
        }),
      ).catch((error: unknown) => {
        console.error("Error submitting instance data:", error)
      })
    }
  }

  if (!name) {
    return <NotFound />
  }

  if (!entity || instanceContent === undefined || !instanceNamesByEntity || !declsLoaded) {
    return (
      <Layout breadcrumbs={[{ url: "/", label: homeTitle }]}>
        <div class="header-with-btns">
          <h1 class="empty-name">
            <span>{entity ? (entity.displayName ?? toTitleCase(entity.name)) : name}</span>
          </h1>
          <button class="destructive" disabled>
            Delete
          </button>
        </div>
        <p class="loading">Loading …</p>
      </Layout>
    )
  }

  const defaultName =
    mode === "edit"
      ? (entity.displayName ?? toTitleCase(entity.name))
      : `New ${entity.displayName ?? toTitleCase(entity.name)}`

  return (
    <Layout breadcrumbs={[{ url: "/", label: homeTitle }]}>
      <div class="header-with-btns">
        <h1>
          <span>{defaultName}</span>
        </h1>
        {mode === "edit" && (
          <button
            class="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this instance?")) {
                deleteSingletonInstanceByEntityName(locales, entity.name)
                  .then(() => reloadSingletonEntities())
                  .then(() => {
                    route(`/`)
                  })
                  .catch((error: unknown) => {
                    if (error instanceof Error) {
                      alert("Error deleting instance:\n\n" + error.toString())
                    }
                  })
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <TypeInput
          type={entity.type}
          value={instanceContent}
          path={undefined}
          instanceNamesByEntity={instanceNamesByEntity}
          childInstances={[]} // not used for singleton instances
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={setInstanceContent as Dispatch<SetStateAction<unknown>>} // guaranteed to be an object because of the ObjectType in the entity
          setChildInstances={() => undefined} // not used for singleton instances
          checkIsLocaleEntity={constant(false)} // not used for singleton instances
        />
        <div class="form-footer btns">
          {buttons.map(button => (
            <button
              key={button.name}
              type="submit"
              name={button.name}
              class={button.primary ? "primary" : undefined}
              disabled={!hasUnsavedChanges}
            >
              {button.label}
            </button>
          ))}
        </div>
      </form>
    </Layout>
  )
}
