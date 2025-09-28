import type { FunctionalComponent } from "preact"
import { useContext, useEffect, useState } from "preact/hooks"
import { toTitleCase } from "../../shared/utils/string.ts"
import { Layout } from "../components/Layout.tsx"
import { EntitiesContext } from "../context/entities.ts"
import { Markdown } from "../utils/Markdown.tsx"

export const homeTitle = "Entities"

export const Home: FunctionalComponent = () => {
  const { entities } = useContext(EntitiesContext)

  useEffect(() => {
    document.title = homeTitle + " — TSONDB"
  }, [])

  const [searchText, setSearchText] = useState("")

  const lowerSearchText = searchText.toLowerCase().replaceAll(" ", "")
  const filteredEntities =
    searchText.length === 0
      ? entities
      : entities.filter(
          entity =>
            entity.declaration.name.toLowerCase().includes(lowerSearchText) ||
            entity.declaration.namePlural.toLowerCase().includes(lowerSearchText),
        )

  return (
    <Layout breadcrumbs={[]}>
      <h1>{homeTitle}</h1>
      <div className="list-header">
        <p class="instance-count">
          {searchText === "" ? "" : `${filteredEntities.length.toString()} of `}
          {entities.length} entit{entities.length === 1 ? "y" : "ies"}
        </p>
        <form
          action=""
          rel="search"
          onSubmit={e => {
            e.preventDefault()
          }}
        >
          <label htmlFor="entity-search" class="visually-hidden">
            Search
          </label>
          <input
            type="text"
            id="entity-search"
            value={searchText}
            onInput={event => {
              setSearchText(event.currentTarget.value)
            }}
          />
        </form>
      </div>
      <ul class="entries entries--entities">
        {filteredEntities.map(entity => (
          <li key={entity.declaration.name} class="entries-item">
            <div class="entries-item__title">
              <h2>{toTitleCase(entity.declaration.namePlural)}</h2>
              {entity.declaration.comment && (
                <Markdown class="description" string={entity.declaration.comment} />
              )}
            </div>
            <p class="entries-item__subtitle">
              {entity.instanceCount} instance{entity.instanceCount === 1 ? "" : "s"}
            </p>
            <div class="entries-item__side">
              <div class="btns">
                <a href={`/entities/${entity.declaration.name}`} class="btn">
                  View
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  )
}
