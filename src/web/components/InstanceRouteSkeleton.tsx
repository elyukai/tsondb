import { deepEqual } from "@elyukai/utils/equality"
import { toTitleCase } from "@elyukai/utils/string"
import type { FunctionalComponent } from "preact"
import { useLocation, useRoute, type LocationHook } from "preact-iso"
import type { SetStateAction } from "preact/compat"
import { useCallback, useContext, useEffect, useMemo, useState, type Dispatch } from "preact/hooks"
import type { UnsafeEntityTaggedInstanceContainerWithChildInstances } from "../../node/utils/childInstances.ts"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import { getSerializedDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"
import type { InstanceContent } from "../../shared/utils/instances.ts"
import { validateLocaleIdentifier } from "../../shared/validation/identifier.ts"
import {
  deleteInstanceByEntityNameAndId,
  getChildInstancesForInstanceByEntityName,
} from "../api/declarations.ts"
import { EntitiesContext } from "../context/entities.ts"
import { GitClientContext } from "../context/gitClient.ts"
import { useEntityFromRoute } from "../hooks/useEntityFromRoute.ts"
import { useInstanceNamesByEntity } from "../hooks/useInstanceNamesByEntity.ts"
import {
  useGetDeclFromDeclName,
  type GetDeclFromDeclName,
} from "../hooks/useSecondaryDeclarations.ts"
import { useSetting } from "../hooks/useSettings.ts"
import { homeTitle } from "../routes/Home.tsx"
import { NotFound } from "../routes/NotFound.tsx"
import { runWithLoading } from "../signals/loading.ts"
import { Layout } from "./Layout.tsx"
import { TypeInput } from "./typeInputs/TypeInput.tsx"
import { ValidationErrors } from "./typeInputs/utils/ValidationErrors.tsx"

export type InstanceRouteSkeletonInitializer = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  getDeclFromDeclName: GetDeclFromDeclName
}) => Promise<void>

export type InstanceRouteSkeletonSubmitHandler<A extends string = string> = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  instanceContent: InstanceContent
  action: A
  customId: string
  isLocaleEntity: boolean | undefined
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  route: LocationHook["route"]
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  setCustomId: Dispatch<SetStateAction<string>>
  getDeclFromDeclName: GetDeclFromDeclName
  updateLocalGitState?: () => Promise<void>
}) => Promise<void>

export type InstanceRouteSkeletonOnSubmitHandler = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  instanceContent: InstanceContent
  buttonName: string | undefined
  customId: string
  isLocaleEntity: boolean | undefined
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  route: LocationHook["route"]
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  setCustomId: Dispatch<SetStateAction<string>>
  getDeclFromDeclName: GetDeclFromDeclName
  updateLocalGitState?: () => Promise<void>
}) => Promise<void>

export type InstanceRouteSkeletonOnSaveHandler = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  instanceContent: InstanceContent
  customId: string
  isLocaleEntity: boolean | undefined
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  route: LocationHook["route"]
  setInstanceContent: Dispatch<SetStateAction<InstanceContent>>
  setCustomId: Dispatch<SetStateAction<string>>
  getDeclFromDeclName: GetDeclFromDeclName
  updateLocalGitState?: () => Promise<void>
}) => Promise<void>

export type InstanceRouteSkeletonTitleBuilder = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  instanceContent: InstanceContent | undefined
}) => string | undefined

type Props = {
  mode: "create" | "edit"
  buttons: { label: string; name: string; primary?: boolean }[]
  init: InstanceRouteSkeletonInitializer
  titleBuilder: InstanceRouteSkeletonTitleBuilder
  onSubmit: InstanceRouteSkeletonOnSubmitHandler
  onSave: InstanceRouteSkeletonOnSaveHandler
}

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- best practice according to MDN
  event.returnValue = "unsaved changes"
}

const applePlatformPattern = /(Mac|iPhone|iPod|iPad)/i

// eslint-disable-next-line @typescript-eslint/no-deprecated
const isApplePlatform = () => applePlatformPattern.test(window.navigator.platform)

const checkCmdOrCtrl = (event: KeyboardEvent) => (isApplePlatform() ? event.metaKey : event.ctrlKey)

export const InstanceRouteSkeleton: FunctionalComponent<Props> = ({
  mode,
  buttons,
  init,
  titleBuilder,
  onSubmit,
  onSave,
}) => {
  const {
    params: { name, id },
  } = useRoute()

  const [locales] = useSetting("displayedLocales")
  const [getDeclFromDeclName, declsLoaded] = useGetDeclFromDeclName()
  const { declaration: entity, isLocaleEntity } = useEntityFromRoute() ?? {}
  const { entities } = useContext(EntitiesContext)
  const [instanceNamesByEntity] = useInstanceNamesByEntity()
  const [instanceContent, setInstanceContent] = useState<InstanceContent>()
  const [savedInstanceContent, setSavedInstanceContent] = useState<unknown>()
  const [savedChildInstances, setSavedChildInstances] = useState<
    UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  >([])
  const [childInstances, setChildInstances] = useState<
    UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  >([])
  const [customId, setCustomId] = useState("")
  const client = useContext(GitClientContext)

  const { route } = useLocation()

  const hasUnsavedChanges = useMemo(
    () =>
      !deepEqual(instanceContent, savedInstanceContent) ||
      !deepEqual(childInstances, savedChildInstances),
    [childInstances, instanceContent, savedChildInstances, savedInstanceContent],
  )

  const saveHandler = useCallback(
    (event: KeyboardEvent) => {
      if (checkCmdOrCtrl(event) && event.key === "s" && entity && instanceContent !== undefined) {
        event.preventDefault()
        runWithLoading(() =>
          onSave({
            locales,
            entity,
            instanceId: id,
            instanceContent,
            route,
            customId,
            getDeclFromDeclName,
            isLocaleEntity,
            setCustomId,
            setInstanceContent: value => {
              setInstanceContent(value)
              setSavedInstanceContent(value)
            },
            childInstances,
            updateLocalGitState: client?.updateLocalState,
          }),
        ).catch((error: unknown) => {
          console.error("Error submitting instance data:", error)
        })
      }
    },
    [
      childInstances,
      client?.updateLocalState,
      customId,
      entity,
      getDeclFromDeclName,
      id,
      instanceContent,
      isLocaleEntity,
      locales,
      onSave,
      route,
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
      (entity && titleBuilder({ locales, entity, instanceContent, instanceId: id })) ??
      "Not found — TSONDB"
  }, [entity, id, instanceContent, locales, titleBuilder])

  useEffect(() => {
    if (entity && instanceContent === undefined && declsLoaded) {
      runWithLoading(() =>
        init({
          locales,
          entity,
          instanceId: id,
          setInstanceContent: value => {
            setInstanceContent(value)
            setSavedInstanceContent(value)
          },
          getDeclFromDeclName,
        }),
      )
        .then(() =>
          id
            ? getChildInstancesForInstanceByEntityName(locales, entity.name, id).then(result => {
                setChildInstances(result.instances)
                setSavedChildInstances(result.instances)
              })
            : Promise.resolve(),
        )
        .catch((error: unknown) => {
          console.error("Error initializing instance route skeleton:", error)
        })
    }
  }, [entity, declsLoaded, getDeclFromDeclName, id, init, instanceContent, locales, name])

  const checkIsLocaleEntity = useCallback(
    (entityName: string) =>
      entities.some(entity => entity.declaration.name === entityName && entity.isLocaleEntity),
    [entities],
  )

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (entity && instanceContent !== undefined) {
      const buttonName = event.submitter?.getAttribute("name") ?? undefined
      runWithLoading(() =>
        onSubmit({
          locales,
          entity,
          instanceId: id,
          instanceContent,
          buttonName,
          route,
          customId,
          getDeclFromDeclName,
          isLocaleEntity,
          setCustomId,
          setInstanceContent: value => {
            setInstanceContent(value)
            setSavedInstanceContent(value)
            setSavedChildInstances(childInstances)
          },
          childInstances,
          updateLocalGitState: client?.updateLocalState,
        }),
      ).catch((error: unknown) => {
        console.error("Error submitting instance data:", error)
      })
    }
  }

  if (!name || (mode === "edit" && !id)) {
    return <NotFound />
  }

  if (!entity || instanceContent === undefined || !instanceNamesByEntity || !declsLoaded) {
    return (
      <Layout
        breadcrumbs={[
          { url: "/", label: homeTitle },
          {
            url: `/entities/${name}`,
            label: entity ? toTitleCase(entity.namePlural) : name,
          },
        ]}
      >
        <div class="header-with-btns">
          <h1 class="empty-name">
            <span>{id}</span>{" "}
            {id && (
              <span class="id" aria-hidden>
                {id}
              </span>
            )}
          </h1>
          <button class="destructive" disabled>
            Delete
          </button>
        </div>
        <p class="loading">Loading …</p>
      </Layout>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Already checked for NotFound above
  const defaultName = mode === "edit" ? id! : customId || `New ${toTitleCase(entity.name)}`
  const instanceName = getSerializedDisplayNameFromEntityInstance(
    entity,
    instanceContent,
    defaultName,
    locales,
  ).name
  const idErrors = mode === "create" && isLocaleEntity ? validateLocaleIdentifier(customId) : []

  return (
    <Layout
      breadcrumbs={[
        { url: "/", label: homeTitle },
        { url: `/entities/${name}`, label: toTitleCase(entity.namePlural) },
      ]}
    >
      <div class="header-with-btns">
        <h1 class={instanceName.length === 0 ? "empty-name" : undefined}>
          <span>{instanceName || defaultName}</span>{" "}
          {id && (
            <span class="id" aria-hidden>
              {id}
            </span>
          )}
        </h1>
        {id && (
          <button
            class="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this instance?")) {
                deleteInstanceByEntityNameAndId(locales, entity.name, id)
                  .then(() => {
                    route(`/entities/${name}`)
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
      {!id && isLocaleEntity && (
        <div class="field field--id">
          <label htmlFor="id">ID</label>
          <p className="comment">The instance’s identifier. An IETF language tag (BCP47).</p>
          <input
            type="text"
            id="id"
            value={customId}
            required
            pattern="[a-z]{2,3}(-[A-Z]{2,3})?"
            placeholder="en-US, de-DE, …"
            onInput={event => {
              setCustomId(event.currentTarget.value)
            }}
            aria-invalid={idErrors.length > 0}
          />
          <ValidationErrors errors={idErrors} />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <TypeInput
          type={entity.type}
          value={instanceContent}
          path={undefined}
          instanceNamesByEntity={instanceNamesByEntity}
          childInstances={childInstances}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={setInstanceContent as Dispatch<SetStateAction<unknown>>} // guaranteed to be an object because of the ObjectType in the entity
          setChildInstances={setChildInstances}
          checkIsLocaleEntity={checkIsLocaleEntity}
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
