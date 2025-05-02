import { FunctionalComponent } from "preact"
import { toTitleCase } from "../../shared/utils/string.js"
import { getAllEntities } from "../api.js"
import { Layout } from "../components/Layout.js"
import { useMappedAPIResource } from "../hooks/useMappedAPIResource.js"

export const Home: FunctionalComponent = () => {
  const [entities] = useMappedAPIResource(getAllEntities, data =>
    data.declarations.sort((a, b) => a.declaration.name.localeCompare(b.declaration.name)),
  )

  return (
    <Layout breadcrumbs={[{ url: "/", label: "Home" }]}>
      <h1>Entities</h1>
      <ul class="entities">
        {(entities ?? []).map(entity => (
          <li key={entity.declaration.name} class="entity-item">
            <div className="title">
              <h2>{toTitleCase(entity.declaration.name)}</h2>
              {entity.declaration.comment && <p>{entity.declaration.comment}</p>}
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
