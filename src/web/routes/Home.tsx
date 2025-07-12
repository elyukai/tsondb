import type { FunctionalComponent } from "preact"
import type { SerializedEntityDecl } from "../../node/schema/index.ts"
import type { GetAllDeclarationsResponseBody } from "../../shared/api.ts"
import { toTitleCase } from "../../shared/utils/string.js"
import { getAllEntities } from "../api.js"
import { Layout } from "../components/Layout.js"
import { useMappedAPIResource } from "../hooks/useMappedAPIResource.js"
import { Markdown } from "../utils/Markdown.tsx"

const mapEntities = (data: GetAllDeclarationsResponseBody<SerializedEntityDecl>) =>
  data.declarations.sort((a, b) => a.declaration.name.localeCompare(b.declaration.name))

export const Home: FunctionalComponent = () => {
  const [entities] = useMappedAPIResource(getAllEntities, mapEntities)

  return (
    <Layout breadcrumbs={[{ url: "/", label: "Home" }]}>
      <h1>Entities</h1>
      <ul class="entities">
        {(entities ?? []).map(entity => (
          <li key={entity.declaration.name} class="entity-item">
            <div className="title">
              <h2>{toTitleCase(entity.declaration.name)}</h2>
              {entity.declaration.comment && (
                <Markdown class="description" string={entity.declaration.comment} />
              )}
            </div>
            <p class="meta">
              {entity.instanceCount} instance{entity.instanceCount === 1 ? "" : "s"}
            </p>
            <div className="btns">
              <a href={`/entities/${entity.declaration.name}`} class="btn">
                View
              </a>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  )
}
