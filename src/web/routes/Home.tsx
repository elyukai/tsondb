import type { FunctionalComponent } from "preact"
import { useEffect, useState } from "preact/hooks"
import type { SerializedEntityDecl } from "../../node/schema/index.ts"
import type { GetAllDeclarationsResponseBody } from "../../shared/api.ts"
import { toTitleCase } from "../../shared/utils/string.ts"
import { getAllEntities } from "../api.ts"
import { Layout } from "../components/Layout.tsx"
import { useMappedAPIResource } from "../hooks/useMappedAPIResource.ts"
import { Markdown } from "../utils/Markdown.tsx"

const mapEntities = (data: GetAllDeclarationsResponseBody<SerializedEntityDecl>) =>
  data.declarations.sort((a, b) => a.declaration.name.localeCompare(b.declaration.name))

export const Home: FunctionalComponent = () => {
  const [entities] = useMappedAPIResource(getAllEntities, mapEntities)

  useEffect(() => {
    document.title = "Entities — TSONDB"
  }, [])

  const [searchText, setSearchText] = useState("")

  const lowerSearchText = searchText.toLowerCase().replaceAll(" ", "")
  const filteredEntities =
    searchText.length === 0
      ? entities
      : entities?.filter(
          entity =>
            entity.declaration.name.toLowerCase().includes(lowerSearchText) ||
            entity.declaration.namePlural.toLowerCase().includes(lowerSearchText),
        )

  return (
    <Layout breadcrumbs={[{ url: "/", label: "Home" }]}>
      <h1>Entities</h1>
      <div className="list-header">
        <p class="instance-count">
          {searchText === "" ? "" : `${(filteredEntities?.length ?? 0).toString()} of `}
          {entities?.length ?? 0} entit{entities?.length === 1 ? "y" : "ies"}
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
        {(filteredEntities ?? []).map(entity => (
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
