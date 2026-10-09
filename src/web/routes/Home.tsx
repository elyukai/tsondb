import { isNotNullish } from "@elyukai/utils/nullable"
import { toTitleCase } from "@elyukai/utils/string"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type { FunctionalComponent } from "preact"
import { useContext, useEffect, useState } from "preact/hooks"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedSingletonEntityDecl } from "../../shared/schema/declarations/SingletonEntityDecl.ts"
import { NodeKind } from "../../shared/schema/Node.ts"
import { deleteSingletonInstanceByEntityName } from "../api/declarations.ts"
import { Layout } from "../components/Layout.tsx"
import { ConfigContext } from "../context/config.ts"
import { EntitiesContext, SingletonEntitiesContext } from "../context/entities.ts"
import { useSetting } from "../hooks/useSettings.ts"
import { Markdown } from "../utils/Markdown.tsx"

export const homeTitle = "Entities"

const isEntityInAnyHomeLayoutSection = (
  entityName: string,
  homeLayoutSections: { title: string; comment?: string; entities: string[] }[],
): boolean => homeLayoutSections.some(section => section.entities.includes(entityName))

type DisplayEntity =
  | {
      type: NodeKind["EntityDecl"]
      declaration: SerializedEntityDecl
      instanceCount: number
      isLocaleEntity: boolean
    }
  | {
      type: NodeKind["SingletonEntityDecl"]
      declaration: SerializedSingletonEntityDecl
      hasInstance: boolean
    }

const renderDisplayEntityTitle = (entity: DisplayEntity): string => {
  switch (entity.type) {
    case NodeKind.EntityDecl: {
      return entity.declaration.displayNamePlural ?? toTitleCase(entity.declaration.namePlural)
    }
    case NodeKind.SingletonEntityDecl: {
      return entity.declaration.displayName ?? toTitleCase(entity.declaration.name)
    }
    default:
      return assertExhaustive(entity)
  }
}

const renderDisplayEntitySubtitle = (entity: DisplayEntity): string => {
  switch (entity.type) {
    case NodeKind.EntityDecl: {
      return `${entity.instanceCount.toFixed()} instance${entity.instanceCount === 1 ? "" : "s"}`
    }
    case NodeKind.SingletonEntityDecl: {
      return entity.hasInstance ? "has instance" : "no instance"
    }
    default:
      return assertExhaustive(entity)
  }
}

const EntityRow: FunctionalComponent<{ entity: DisplayEntity }> = ({ entity }) => {
  const { reloadSingletonEntities } = useContext(SingletonEntitiesContext)
  const [locales] = useSetting("displayedLocales")

  return (
    <li key={entity.declaration.name} class="entries-item">
      <div class="entries-item__title">
        <h2>{renderDisplayEntityTitle(entity)}</h2>
        {entity.declaration.comment && (
          <Markdown class="description" string={entity.declaration.comment} />
        )}
      </div>
      <p class="entries-item__subtitle">{renderDisplayEntitySubtitle(entity)}</p>
      <div class="entries-item__side">
        <div class="btns">
          {entity.type === NodeKind.EntityDecl ? (
            <a href={`/entities/${entity.declaration.name}`} class="btn">
              View
            </a>
          ) : entity.hasInstance ? (
            <>
              <a href={`/entities/${entity.declaration.name}/instance`} class="btn">
                Edit
              </a>
              <button
                class="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this instance?")) {
                    deleteSingletonInstanceByEntityName(locales, entity.declaration.name)
                      .then(() => reloadSingletonEntities())
                      .catch((error: unknown) => {
                        if (error instanceof Error) {
                          alert(`Error deleting instance:\n\n${error.toString()}`)
                        }
                      })
                  }
                }}
              >
                Delete
              </button>
            </>
          ) : (
            <a
              class="btn btn--primary"
              href={`/entities/${entity.declaration.name}/instance/create`}
            >
              Add
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

export const Home: FunctionalComponent = () => {
  const { homeLayoutSections } = useContext(ConfigContext)
  const { entities } = useContext(EntitiesContext)
  const { singletonEntities } = useContext(SingletonEntitiesContext)

  useEffect(() => {
    document.title = `${homeTitle} — TSONDB`
  }, [])

  const [searchText, setSearchText] = useState("")

  const lowerSearchText = searchText.toLowerCase().replaceAll(" ", "")
  const filteredEntities =
    searchText.length === 0
      ? [
          ...entities.filter(entity => entity.declaration.parentReferenceKey === undefined),
          ...singletonEntities,
        ]
      : [
          ...entities.filter(
            entity =>
              entity.declaration.parentReferenceKey === undefined &&
              (entity.declaration.name.toLowerCase().includes(lowerSearchText) ||
                entity.declaration.namePlural.toLowerCase().includes(lowerSearchText)),
          ),
          ...singletonEntities.filter(entity =>
            entity.declaration.name.toLowerCase().includes(lowerSearchText),
          ),
        ]

  const filteredEntitiesBySection = homeLayoutSections
    ? [
        ...homeLayoutSections.map(section => ({
          ...section,
          entities: section.entities
            .map(entityName =>
              filteredEntities.find(entity => entity.declaration.name === entityName),
            )
            .filter(isNotNullish),
        })),
        {
          title: "Other",
          entities: filteredEntities
            .filter(
              entity =>
                !isEntityInAnyHomeLayoutSection(entity.declaration.name, homeLayoutSections),
            )
            .toSorted((a, b) => a.declaration.name.localeCompare(b.declaration.name)),
        },
      ].filter(section => section.entities.length > 0)
    : undefined

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
              <ul class="entries entries--entities">
                {section.entities.map(entity => (
                  <EntityRow key={entity.declaration.name} entity={entity} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <ul class="entries entries--entities">
          {filteredEntities.map(entity => (
            <EntityRow key={entity.declaration.name} entity={entity} />
          ))}
        </ul>
      )}
    </Layout>
  )
}
