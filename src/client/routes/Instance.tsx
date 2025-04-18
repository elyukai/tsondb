import { FunctionalComponent } from "preact"
import { useRoute } from "preact-iso"
import { useEffect, useState } from "preact/hooks"
import { SerializedEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { InstanceContainer } from "../../utils/instances.js"
import { getEntityByName, getInstanceByEntityNameAndId } from "../api.js"
import { getDisplayNameFromEntityInstance } from "../utils/displayName.js"
import { NotFound } from "./NotFound.js"

export const Instance: FunctionalComponent = () => {
  const {
    params: { name, id },
  } = useRoute()

  if (!name || !id) {
    return <NotFound />
  }

  const [entity, setEntity] = useState<SerializedEntityDecl>()
  const [instance, setInstance] = useState<InstanceContainer>()

  useEffect(() => {
    Promise.all([getEntityByName(name), getInstanceByEntityNameAndId(name, id)])
      .then(([entityData, instanceData]) => {
        setEntity(entityData)
        setInstance(instanceData)
      })
      .catch(error => {
        console.error("Error fetching entities:", error)
      })
  }, [])

  if (!entity || !instance) {
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
          <a href={`/entities/${entity.name}`}>{entity.name}</a>
        </nav>
      </header>
      <main>
        <h1>{getDisplayNameFromEntityInstance(entity, instance)}</h1>
      </main>
    </>
  )
}
