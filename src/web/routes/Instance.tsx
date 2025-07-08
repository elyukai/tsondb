import { FunctionalComponent } from "preact"
import { useLocation, useRoute } from "preact-iso"
import { useEffect, useMemo, useState } from "preact/hooks"
import { deepEqual } from "../../shared/utils/compare.js"
import { getDisplayNameFromEntityInstance } from "../../shared/utils/displayName.js"
import { InstanceContainer } from "../../shared/utils/instances.js"
import {
  deleteInstanceByEntityNameAndId,
  getInstanceByEntityNameAndId,
  updateInstanceByEntityNameAndId,
} from "../api.js"
import { Layout } from "../components/Layout.js"
import { TypeInput } from "../components/typeInputs/TypeInput.js"
import { useEntityFromRoute } from "../hooks/useEntityFromRoute.js"
import { useInstanceNamesByEntity } from "../hooks/useInstanceNamesByEntity.js"
import { useGetDeclFromDeclName } from "../hooks/useSecondaryDeclarations.js"
import { NotFound } from "./NotFound.js"

export const Instance: FunctionalComponent = () => {
  const {
    params: { name, id },
  } = useRoute()

  const getDeclFromDeclName = useGetDeclFromDeclName()
  const entityFromRoute = useEntityFromRoute()
  const [instanceNamesByEntity] = useInstanceNamesByEntity()
  const [instance, setInstance] = useState<InstanceContainer>()
  const [originalInstance, setOriginalInstance] = useState<InstanceContainer>()

  const { route } = useLocation()

  const hasChanges = useMemo(
    () => !deepEqual(instance?.content, originalInstance?.content),
    [instance?.content, originalInstance?.content],
  )

  useEffect(() => {
    if (name && id) {
      getInstanceByEntityNameAndId(name, id)
        .then(instanceData => {
          setInstance(instanceData.instance)
          setOriginalInstance(instanceData.instance)
        })
        .catch(error => {
          console.error("Error fetching entities:", error)
        })
    }
  }, [])

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    if (name && id && instance) {
      updateInstanceByEntityNameAndId(name, id, instance.content)
        .then(updatedInstance => {
          0
          setInstance(updatedInstance.instance)
          setOriginalInstance(updatedInstance.instance)
        })
        .catch(error => {
          alert(`Error updating instance:\n\n${error}`)
        })
    }
  }

  if (!name || !id) {
    return <NotFound />
  }

  if (!entityFromRoute || !instance || !originalInstance) {
    return (
      <Layout
        breadcrumbs={[
          { url: "/", label: "Home" },
          { url: `/entities/${name}`, label: name },
        ]}
      >
        <h1>{id}</h1>
        <p className="loading">Loading …</p>
      </Layout>
    )
  }

  const defaultName = id
  const instanceName = getDisplayNameFromEntityInstance(
    entityFromRoute.entity,
    instance.content,
    defaultName,
  )

  return (
    <Layout
      breadcrumbs={[
        { url: "/", label: "Home" },
        { url: `/entities/${name}`, label: entityFromRoute.entity.name },
      ]}
    >
      <div class="header-with-btns">
        <h1 class={instanceName.length === 0 ? "empty-name" : undefined}>
          <span>{instanceName || defaultName}</span>{" "}
          <span className="id" aria-hidden>
            {instance.id}
          </span>
        </h1>
        <button
          class="destructive"
          onClick={() => {
            if (confirm("Are you sure you want to delete this instance?")) {
              deleteInstanceByEntityNameAndId(entityFromRoute.entity.name, instance.id)
                .then(() => {
                  route(`/entities/${name}`)
                })
                .catch(error => {
                  alert("Error deleting instance:\n\n" + error)
                })
            }
          }}
        >
          Delete
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <TypeInput
          type={entityFromRoute.entity.type}
          value={instance.content}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={value => setInstance(container => ({ ...container!, content: value }))}
        />
        <button type="submit" disabled={!hasChanges} class="primary">
          Save
        </button>
      </form>
    </Layout>
  )
}
