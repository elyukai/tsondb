import type { FunctionalComponent } from "preact"
import { useLocation, useRoute } from "preact-iso"
import { useEffect, useMemo, useState } from "preact/hooks"
import { deepEqual } from "../../shared/utils/compare.ts"
import { getSerializedDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"
import type { InstanceContainer } from "../../shared/utils/instances.ts"
import {
  deleteInstanceByEntityNameAndId,
  getInstanceByEntityNameAndId,
  updateInstanceByEntityNameAndId,
} from "../api.ts"
import { Layout } from "../components/Layout.tsx"
import { TypeInput } from "../components/typeInputs/TypeInput.tsx"
import { useEntityFromRoute } from "../hooks/useEntityFromRoute.ts"
import { useInstanceNamesByEntity } from "../hooks/useInstanceNamesByEntity.ts"
import { useGetDeclFromDeclName } from "../hooks/useSecondaryDeclarations.ts"
import { NotFound } from "./NotFound.tsx"

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
        .catch((error: unknown) => {
          console.error("Error fetching entities:", error)
        })
    }
  }, [id, name])

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    if (name && id && instance) {
      updateInstanceByEntityNameAndId(name, id, instance.content)
        .then(updatedInstance => {
          setInstance(updatedInstance.instance)
          setOriginalInstance(updatedInstance.instance)
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            alert(`Error updating instance:\n\n${error}`)
          }
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
  const instanceName = getSerializedDisplayNameFromEntityInstance(
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
                .catch((error: unknown) => {
                  if (error instanceof Error) {
                    alert("Error deleting instance:\n\n" + error.toString())
                  }
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
          onChange={value => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            setInstance(container => ({ ...container!, content: value }))
          }}
        />
        <button type="submit" disabled={!hasChanges} class="primary">
          Save
        </button>
      </form>
    </Layout>
  )
}
