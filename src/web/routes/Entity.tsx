import type { FunctionalComponent } from "preact"
import { useRoute } from "preact-iso"
import { useContext, useEffect, useState } from "preact/hooks"
import type { GetAllInstancesOfEntityResponseBody } from "../../shared/api.ts"
import { getGitStatusForDisplay, getLabelForGitStatus } from "../../shared/utils/git.ts"
import { toTitleCase } from "../../shared/utils/string.ts"
import { deleteInstanceByEntityNameAndId, getInstancesByEntityName } from "../api.ts"
import { Layout } from "../components/Layout.ts"
import { EntitiesContext } from "../context/entities.ts"
import { useEntityFromRoute } from "../hooks/useEntityFromRoute.ts"
import { useMappedAPIResource } from "../hooks/useMappedAPIResource.ts"
import { Markdown } from "../utils/Markdown.tsx"
import { homeTitle } from "./Home.tsx"
import { NotFound } from "./NotFound.tsx"

const mapInstances = (data: GetAllInstancesOfEntityResponseBody) => data.instances

export const Entity: FunctionalComponent = () => {
  const {
    params: { name },
    query: { created },
  } = useRoute()

  const [searchText, setSearchText] = useState("")
  const entityFromRoute = useEntityFromRoute()
  const { reloadEntities } = useContext(EntitiesContext)
  const { declaration: entity } = entityFromRoute ?? {}
  const [instances, reloadInstances] = useMappedAPIResource(
    getInstancesByEntityName,
    mapInstances,
    name ?? "",
  )

  useEffect(() => {
    document.title = toTitleCase(entity?.namePlural ?? name ?? "") + " — TSONDB"
  }, [entity?.namePlural, name])

  useEffect(() => {
    if (created) {
      const instanceElement = document.getElementById(`instance-${created}`)
      if (instanceElement) {
        instanceElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [created])

  if (!name) {
    return <NotFound />
  }

  if (!entity || !instances) {
    return (
      <div>
        <h1>{toTitleCase(entity?.namePlural ?? name)}</h1>
        <p className="loading">Loading …</p>
      </div>
    )
  }

  const lowerSearchText = searchText.toLowerCase()
  const filteredInstances =
    searchText.length === 0
      ? instances
      : instances.filter(
          instance =>
            instance.id.includes(searchText) ||
            instance.displayName.toLowerCase().includes(lowerSearchText),
        )

  return (
    <Layout breadcrumbs={[{ url: "/", label: homeTitle }]}>
      <div class="header-with-btns">
        <h1>{toTitleCase(entity.namePlural)}</h1>
        <a class="btn btn--primary" href={`/entities/${entity.name}/instances/create`}>
          Add
        </a>
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
          />
        </form>
      </div>
      <ul class="entries entries--instances">
        {filteredInstances.map(instance => {
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
              <div class="entries-item__side">
                {gitStatusForDisplay !== undefined && (
                  <p
                    class={`git-status git-status--${gitStatusForDisplay}`}
                    title={getLabelForGitStatus(gitStatusForDisplay)}
                  >
                    {gitStatusForDisplay}
                  </p>
                )}
                <div class="btns">
                  <a href={`/entities/${entity.name}/instances/${instance.id}`} class="btn">
                    Edit
                  </a>
                  <button
                    class="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this instance?")) {
                        deleteInstanceByEntityNameAndId(entity.name, instance.id)
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
            </li>
          )
        })}
      </ul>
    </Layout>
  )
}
