import { reorder } from "@elyukai/utils/array/modify"
import { toTitleCase } from "@elyukai/utils/string"
import type { FunctionalComponent } from "preact"
import { useRoute } from "preact-iso"
import { useCallback, useContext, useEffect, useState } from "preact/hooks"
import type { GetAllInstancesOfEntityResponseBody } from "../../shared/api.ts"
import { isReorderableSortOrder } from "../../shared/schema/utils/sortOrder.ts"
import { getGitStatusForDisplay } from "../../shared/utils/git.ts"
import type { InstanceContainerOverview } from "../../shared/utils/instances.ts"
import {
  deleteInstanceByEntityNameAndId,
  getInstancesByEntityName,
  getLocaleInstances,
  reorderAllInstancesInEntity,
} from "../api/declarations.ts"
import { GitStatusIndicator } from "../components/git/GitStatusIndicator.tsx"
import { Layout } from "../components/Layout.tsx"
import { ConfigContext } from "../context/config.ts"
import { EntitiesContext } from "../context/entities.ts"
import { GitClientContext } from "../context/gitClient.ts"
import { useEntityFromRoute } from "../hooks/useEntityFromRoute.ts"
import { useMappedAPIResource } from "../hooks/useMappedAPIResource.ts"
import { useSetting } from "../hooks/useSettings.ts"
import { logAndAlertError } from "../utils/debug.ts"
import { Markdown } from "../utils/Markdown.tsx"
import { homeTitle } from "./Home.tsx"
import { NotFound } from "./NotFound.tsx"

const localeMapper = (result: GetAllInstancesOfEntityResponseBody) => result.instances
const mapInstances = (data: Pick<GetAllInstancesOfEntityResponseBody, "instances">) =>
  data.instances

export const Entity: FunctionalComponent = () => {
  const {
    params: { name },
    query: { created },
  } = useRoute()

  const [locales] = useSetting("displayedLocales")
  const [searchText, setSearchText] = useState("")
  const entityFromRoute = useEntityFromRoute()
  const config = useContext(ConfigContext)
  const gitClient = useContext(GitClientContext)
  const { reloadEntities } = useContext(EntitiesContext)
  const { declaration: entity, isLocaleEntity } = entityFromRoute ?? {}
  const [instances, reloadInstances, setInstances] = useMappedAPIResource<
    Pick<GetAllInstancesOfEntityResponseBody, "instances">,
    [string[], string],
    InstanceContainerOverview[]
  >(getInstancesByEntityName, mapInstances, locales, entity?.name ?? name ?? "")
  const [localeInstances, reloadLocaleInstances] = useMappedAPIResource(
    getLocaleInstances,
    localeMapper,
    locales,
    config.localeEntityName,
  )
  const [inEditMode, setInEditMode] = useState(false)
  const [inApplyingNewOrder, setInApplyingNewOrder] = useState(false)
  const [orderedInstances, setOrderedInstances] = useState<InstanceContainerOverview[]>([])

  useEffect(() => {
    setOrderedInstances(instances ?? [])
  }, [instances])

  const toggleEditMode = useCallback(() => {
    if (entity && !inApplyingNewOrder) {
      if (inEditMode) {
        setInApplyingNewOrder(true)
        reorderAllInstancesInEntity(
          locales,
          entity.name,
          orderedInstances.map(i => i.id),
        )
          .then(res => {
            setInstances(res)
            setInEditMode(false)
          }, logAndAlertError)
          .finally(() => {
            setInApplyingNewOrder(false)
          })
      } else {
        setInEditMode(true)
      }
    }
  }, [entity, inApplyingNewOrder, inEditMode, locales, orderedInstances, setInstances])

  const { latestCommit } = useContext(GitClientContext) ?? {}

  useEffect(() => {
    reloadInstances()
      .then(() => reloadLocaleInstances())
      .catch(logAndAlertError)
  }, [latestCommit, reloadInstances, reloadLocaleInstances])

  useEffect(() => {
    document.title =
      (entity?.displayNamePlural ?? toTitleCase(entity?.namePlural ?? name ?? "")) + " — TSONDB"
  }, [entity?.displayNamePlural, entity?.namePlural, name])

  useEffect(() => {
    if (created) {
      const instanceElement = document.getElementById(`instance-${created}`)
      if (instanceElement) {
        instanceElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [created])

  if (entity?.name === undefined) {
    return <NotFound />
  }

  if (!instances) {
    return (
      <Layout breadcrumbs={[{ url: "/", label: homeTitle }]}>
        <div class="header-with-btns">
          <h1>{toTitleCase(entity.namePlural)}</h1>
          <a class="btn btn--primary" aria-disabled>
            Add
          </a>
        </div>
        <p class="loading">Loading …</p>
      </Layout>
    )
  }

  const lowerSearchText = searchText.toLowerCase()
  const filteredInstances = (
    searchText.length === 0
      ? instances
      : instances.filter(
          instance =>
            instance.id.includes(searchText) ||
            instance.displayName.toLowerCase().includes(lowerSearchText),
        )
  ).map(instance => ({
    ...instance,
    gitStatus: gitClient?.getGitStatusOfInstance(entity.name, instance.id),
  }))

  const instancesByLocale = Object.groupBy(
    filteredInstances,
    instance => instance.displayNameLocaleId ?? "undefined",
  )

  const groupedInstances = [...locales, "undefined"]
    .map(key => ({
      id: key,
      name:
        key === "undefined"
          ? "No matching locale"
          : (localeInstances?.find(instance => instance.id === key)?.displayName ?? key),
      instances: instancesByLocale[key] ?? [],
    }))
    .filter(group => group.instances.length > 0)

  const instanceMapper = (
    instance: InstanceContainerOverview,
    index: number,
    instancesArr: InstanceContainerOverview[],
  ) => {
    const gitStatusForDisplay = getGitStatusForDisplay(instance.gitStatus)
    return (
      <li
        key={instance.id}
        id={`instance-${instance.id}`}
        class={`entries-item ${created === instance.id ? "entries-item--created" : ""} ${
          gitStatusForDisplay === undefined ? "" : `git-status--${gitStatusForDisplay}`
        }`}
      >
        <h2 class="entries-item__title">{instance.displayName}</h2>
        <p aria-hidden class="entries-item__subtitle entries-item__subtitle--id">
          {instance.id}
        </p>
        {inEditMode ? (
          <div class="entries-item__side">
            <div class="btns">
              <button
                disabled={index <= 0}
                onClick={() => {
                  setOrderedInstances(ins => reorder(ins, index, index - 1))
                }}
              >
                Move up
              </button>
              <button
                disabled={index >= instancesArr.length - 1}
                onClick={() => {
                  setOrderedInstances(ins => reorder(ins, index, index + 1))
                }}
              >
                Move down
              </button>
            </div>
          </div>
        ) : (
          <div class="entries-item__side">
            <GitStatusIndicator status={instance.gitStatus} />
            <div class="btns">
              <a href={`/entities/${entity.name}/instances/${instance.id}`} class="btn">
                Edit
              </a>
              <button
                class="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this instance?")) {
                    deleteInstanceByEntityNameAndId(locales, entity.name, instance.id)
                      .then(() => reloadInstances())
                      .then(() => reloadEntities())
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
            </div>
          </div>
        )}
      </li>
    )
  }

  return (
    <Layout breadcrumbs={[{ url: "/", label: homeTitle }]}>
      <div class="header-with-btns">
        <h1>{toTitleCase(entity.namePlural)}</h1>
        <div className="btns">
          {isReorderableSortOrder(entity.sortOrder) ? null : (
            <button onClick={toggleEditMode}>{inEditMode ? "Apply new order" : "Reorder"}</button>
          )}
          <a class="btn btn--primary" href={`/entities/${entity.name}/instances/create`}>
            Add
          </a>
        </div>
      </div>
      {entity.comment && <Markdown class="description" string={entity.comment} />}
      <div className="list-header">
        <p class="instance-count">
          {searchText === "" ? "" : `${filteredInstances.length.toString()} of `}
          {instances.length} instance{instances.length === 1 ? "" : "s"}
        </p>
        <form
          action=""
          rel="search"
          onSubmit={e => {
            e.preventDefault()
          }}
        >
          <label htmlFor="instance-search" class="visually-hidden">
            Search
          </label>
          <input
            type="text"
            id="instance-search"
            value={searchText}
            onInput={event => {
              setSearchText(event.currentTarget.value)
            }}
            disabled={inEditMode}
          />
        </form>
      </div>
      {inEditMode ? (
        <ul class="entries entries--instances">{orderedInstances.map(instanceMapper)}</ul>
      ) : isLocaleEntity ||
        (groupedInstances.length === 1 &&
          groupedInstances[0]?.id !== "undefined" &&
          locales[0] === groupedInstances[0]?.id) ? (
        <ul class="entries entries--instances">{filteredInstances.map(instanceMapper)}</ul>
      ) : (
        <ul class="entry-groups">
          {groupedInstances.map(group => (
            <li class="entry-groups-item" key={`group-${group.id}`}>
              <h2 class="entry-groups-item__title">{group.name}</h2>
              {group.id === "undefined" ? (
                <p>
                  {group.instances.length} other instance{group.instances.length === 1 ? "" : "s"}
                </p>
              ) : (
                <ul class="entries entries--instances">{group.instances.map(instanceMapper)}</ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Layout>
  )
}
