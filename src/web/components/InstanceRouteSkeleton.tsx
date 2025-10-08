import type { FunctionalComponent } from "preact"
import { useLocation, useRoute, type LocationHook } from "preact-iso"
import type { SetStateAction } from "preact/compat"
import { useCallback, useEffect, useState, type Dispatch } from "preact/hooks"
import type { UnsafeEntityTaggedInstanceContainerWithChildInstances } from "../../node/utils/childInstances.ts"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import { removeAt } from "../../shared/utils/array.ts"
import { getSerializedDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"
import { toTitleCase } from "../../shared/utils/string.ts"
import { validateLocaleIdentifier } from "../../shared/validation/identifier.ts"
import {
  deleteInstanceByEntityNameAndId,
  getChildInstancesForInstanceByEntityName,
} from "../api/declarations.ts"
import { useEntityFromRoute } from "../hooks/useEntityFromRoute.ts"
import { useInstanceNamesByEntity } from "../hooks/useInstanceNamesByEntity.ts"
import {
  useGetDeclFromDeclName,
  type GetDeclFromDeclName,
} from "../hooks/useSecondaryDeclarations.ts"
import { useSetting } from "../hooks/useSettings.ts"
import { homeTitle } from "../routes/Home.tsx"
import { NotFound } from "../routes/NotFound.tsx"
import { Layout } from "./Layout.tsx"
import { TypeInput } from "./typeInputs/TypeInput.tsx"
import { ValidationErrors } from "./typeInputs/utils/ValidationErrors.tsx"

export type InstanceRouteSkeletonInitializer = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  setInstanceContent: Dispatch<SetStateAction<unknown>>
  getDeclFromDeclName: GetDeclFromDeclName
}) => Promise<void>

export type InstanceRouteSkeletonOnSubmitHandler = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  instanceContent: unknown
  buttonName: string | undefined
  customId: string
  isLocaleEntity: boolean | undefined
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  route: LocationHook["route"]
  setInstanceContent: Dispatch<SetStateAction<unknown>>
  setCustomId: Dispatch<SetStateAction<string>>
  getDeclFromDeclName: GetDeclFromDeclName
}) => Promise<void>

export type InstanceRouteSkeletonTitleBuilder = (values: {
  locales: string[]
  entity: SerializedEntityDecl
  instanceId: string | undefined
  instanceContent: unknown
}) => string | undefined

type Props = {
  mode: "create" | "edit"
  buttons: { label: string; name: string; primary?: boolean }[]
  init: InstanceRouteSkeletonInitializer
  titleBuilder: InstanceRouteSkeletonTitleBuilder
  onSubmit: InstanceRouteSkeletonOnSubmitHandler
}

export const InstanceRouteSkeleton: FunctionalComponent<Props> = ({
  mode,
  buttons,
  init,
  titleBuilder,
  onSubmit,
}) => {
  const {
    params: { name, id },
  } = useRoute()

  const [locales] = useSetting("displayedLocales")
  const [getDeclFromDeclName, declsLoaded] = useGetDeclFromDeclName()
  const { declaration: entity, isLocaleEntity } = useEntityFromRoute() ?? {}
  const [instanceNamesByEntity] = useInstanceNamesByEntity()
  const [instanceContent, setInstanceContent] = useState<unknown>()
  const [childInstances, setChildInstances] = useState<
    UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  >([])
  const [customId, setCustomId] = useState("")

  const { route } = useLocation()

  useEffect(() => {
    document.title =
      (entity && titleBuilder({ locales, entity, instanceContent, instanceId: id })) ??
      "Not found — TSONDB"
  }, [entity, id, instanceContent, locales, titleBuilder])

  useEffect(() => {
    if (entity && instanceContent === undefined && declsLoaded) {
      init({ locales, entity, instanceId: id, setInstanceContent, getDeclFromDeclName })
        .then(() =>
          id
            ? getChildInstancesForInstanceByEntityName(locales, entity.name, id).then(result => {
                setChildInstances(result.instances)
              })
            : Promise.resolve(),
        )
        .catch((error: unknown) => {
          console.error("Error initializing instance route skeleton:", error)
        })
    }
  }, [entity, declsLoaded, getDeclFromDeclName, id, init, instanceContent, locales, name])

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (entity && instanceContent !== undefined) {
      const buttonName = event.submitter?.getAttribute("name") ?? undefined
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
        setInstanceContent,
        childInstances,
      }).catch((error: unknown) => {
        console.error("Error submitting instance data:", error)
      })
    }
  }

  const handleOnChildChange = useCallback((index: number, value: unknown) => {
    setChildInstances(old =>
      old[index] ? old.with(index, { ...old[index], content: value }) : old,
    )
  }, [])

  const handleOnChildAdd = useCallback((entityName: string, value: unknown) => {
    setChildInstances(old => [
      ...old,
      { entityName, childInstances: [], id: undefined, content: value },
    ])
  }, [])

  const handleOnChildRemove = useCallback((index: number) => {
    setChildInstances(old => removeAt(old, index))
  }, [])

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
          onChange={setInstanceContent}
          onChildChange={handleOnChildChange}
          onChildAdd={handleOnChildAdd}
          onChildRemove={handleOnChildRemove}
        />
        <div class="form-footer btns">
          {buttons.map(button => (
            <button
              key={button.name}
              type="submit"
              name={button.name}
              class={button.primary ? "primary" : undefined}
            >
              {button.label}
            </button>
          ))}
        </div>
      </form>
    </Layout>
  )
}
