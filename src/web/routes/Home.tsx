import type { FunctionalComponent } from "preact"
import { useContext, useEffect, useState } from "preact/hooks"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import { toTitleCase } from "../../shared/utils/string.ts"
import { Layout } from "../components/Layout.tsx"
import { ConfigContext } from "../context/config.ts"
import { EntitiesContext } from "../context/entities.ts"
import { Markdown } from "../utils/Markdown.tsx"

export const homeTitle = "Entities"

const isEntityInAnyHomeLayoutSection = (
  entityName: string,
  homeLayoutSections: { title: string; comment?: string; entities: string[] }[],
): boolean => homeLayoutSections.some(section => section.entities.includes(entityName))

export const Home: FunctionalComponent = () => {
  const { homeLayoutSections } = useContext(ConfigContext)
  const { entities } = useContext(EntitiesContext)

  useEffect(() => {
    document.title = homeTitle + " — TSONDB"
  }, [])

  const [searchText, setSearchText] = useState("")

  const lowerSearchText = searchText.toLowerCase().replaceAll(" ", "")
  const filteredEntities =
    searchText.length === 0
      ? entities.filter(entity => entity.declaration.parentReferenceKey === undefined)
      : entities.filter(
          entity =>
            entity.declaration.parentReferenceKey === undefined &&
            (entity.declaration.name.toLowerCase().includes(lowerSearchText) ||
              entity.declaration.namePlural.toLowerCase().includes(lowerSearchText)),
        )

  const filteredEntitiesBySection = homeLayoutSections
    ? [
        ...homeLayoutSections.map(section => ({
          ...section,
          entities: section.entities
            .map(entityName =>
              filteredEntities.find(entity => entity.declaration.name === entityName),
            )
            .filter(entity => entity !== undefined),
        })),
        {
          title: "Other",
          entities: filteredEntities.filter(
            entity => !isEntityInAnyHomeLayoutSection(entity.declaration.name, homeLayoutSections),
          ),
        },
      ].filter(section => section.entities.length > 0)
    : undefined

  const mapEntity = (entity: {
    declaration: SerializedEntityDecl
    instanceCount: number
    isLocaleEntity: boolean
  }) => (
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
      {filteredEntitiesBySection ? (
        <ul class="entry-groups">
          {filteredEntitiesBySection.map((section, si) => (
            <li key={si} class="entry-groups-item">
              <h2 class="entry-groups-item__title">{section.title}</h2>
              {section.comment && <Markdown class="description" string={section.comment} />}
              <ul class="entries entries--entities">{section.entities.map(mapEntity)}</ul>
            </li>
          ))}
        </ul>
      ) : (
        <ul class="entries entries--entities">{filteredEntities.map(mapEntity)}</ul>
      )}
    </Layout>
  )
}
