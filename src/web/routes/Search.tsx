import { toTitleCase } from "@elyukai/utils/string"
import type { FunctionalComponent } from "preact"
import { useCallback, useEffect, useState } from "preact/hooks"
import { getGitStatusForDisplay } from "../../shared/utils/git.ts"
import type { InstanceContainerOverview } from "../../shared/utils/instances.ts"
import { deleteInstanceByEntityNameAndId } from "../api/declarations.ts"
import { searchInstances } from "../api/search.ts"
import { GitStatusIndicator } from "../components/git/GitStatusIndicator.tsx"
import { Layout } from "../components/Layout.tsx"
import { useSetting } from "../hooks/useSettings.ts"
import { logAndAlertError } from "../utils/debug.ts"
import { homeTitle } from "./Home.tsx"

const MIN_CHARACTERS = 3

export const Search: FunctionalComponent = () => {
  const [locales] = useSetting("displayedLocales")
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? "",
  )
  const [results, setResults] = useState<[string, InstanceContainerOverview][]>()

  const search = useCallback(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get("q") !== query) {
      if (query.length === 0) {
        url.searchParams.delete("q")
      } else {
        url.searchParams.set("q", query)
      }
      window.history.pushState({}, "", url)
    }
    if (query.length >= MIN_CHARACTERS) {
      searchInstances(locales, query)
        .then(res => {
          setResults(res.results)
        })
        .catch(logAndAlertError)
    }
  }, [locales, query])

  useEffect(() => {
    document.title = "Search — TSONDB"
    search()
  }, [search])

  return (
    <Layout breadcrumbs={[{ url: "/", label: homeTitle }]}>
      <h1>Search</h1>
      <input
        type="search"
        name="q"
        value={query}
        onInput={event => {
          setQuery(event.currentTarget.value)
        }}
      />
      {query.length < MIN_CHARACTERS ? (
        <p class="help">Provide at least 3 characters in the search field to start the search</p>
      ) : (
        results && (
          <section class="search-results">
            <h2>Results</h2>
            {results.length === 0 ? (
              <p class="empty">No results</p>
            ) : (
              <ul class="entries entries--instances">
                {results.map(([entityName, instance]) => {
                  const gitStatusForDisplay = getGitStatusForDisplay(instance.gitStatus)
                  return (
                    <li
                      key={instance.id}
                      id={`instance-${instance.id}`}
                      class={`entries-item${
                        gitStatusForDisplay === undefined
                          ? ""
                          : ` git-status--${gitStatusForDisplay}`
                      }`}
                    >
                      <h2 class="entries-item__title">
                        {instance.displayName}
                        <span aria-hidden class="entries-item__title-entity">
                          {toTitleCase(entityName)}
                        </span>
                      </h2>
                      <p aria-hidden class="entries-item__subtitle entries-item__subtitle--id">
                        {instance.id}
                      </p>
                      <div class="entries-item__side">
                        <GitStatusIndicator status={instance.gitStatus} />
                        <div class="btns">
                          <a href={`/entities/${entityName}/instances/${instance.id}`} class="btn">
                            Edit
                          </a>
                          <button
                            class="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this instance?")) {
                                deleteInstanceByEntityNameAndId(locales, entityName, instance.id)
                                  .then(() => {
                                    search()
                                  })
                                  .catch(logAndAlertError)
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
            )}
          </section>
        )
      )}
    </Layout>
  )
}
