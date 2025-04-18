import { FunctionalComponent } from "preact"
import { useRoute } from "preact-iso"
import { useEffect, useState } from "preact/hooks"
import { SerializedEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { InstanceContainer } from "../../utils/instances.js"
import { getEntityByName, getInstancesByEntityName } from "../api.js"
import { getDisplayNameFromEntityInstance } from "../utils/displayName.js"
import { NotFound } from "./NotFound.js"

export const Entity: FunctionalComponent = () => {
  const {
    params: { name },
  } = useRoute()

  if (!name) {
    return <NotFound />
  }

  const [entity, setEntity] = useState<SerializedEntityDecl>()
  const [instances, setInstances] = useState<InstanceContainer[]>()

  useEffect(() => {
    Promise.all([getEntityByName(name), getInstancesByEntityName(name)])
      .then(([entityData, instancesData]) => {
        setEntity(entityData)
        setInstances(instancesData)
      })
      .catch(error => {
        console.error("Error fetching entities:", error)
      })
  }, [])

  if (!entity || !instances) {
    return (
      <div>
        <h1>Loading …</h1>
      </div>
    )
  }

  return (
    <>
      <header>
        <nav>
          <a href="/">Home</a>
        </nav>
      </header>
      <main>
        <h1>{entity.name}</h1>
        <p>
          {instances.length} instance{instances.length === 1 ? "" : "s"}
        </p>
        <ul>
          {instances.map(instance => (
            <li key={instance.id}>
              <a href={`/entities/${entity.name}/instances/${instance.id}`}>
                <h2>{getDisplayNameFromEntityInstance(entity, instance)}</h2>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
