import type { FunctionalComponent } from "preact"
import { useLocation, useRoute } from "preact-iso"
import { useCallback, useEffect, useState } from "preact/hooks"
import { getSerializedDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"
import type { InstanceContainer } from "../../shared/utils/instances.ts"
import { toTitleCase } from "../../shared/utils/string.ts"
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
import { homeTitle } from "./Home.tsx"
import { NotFound } from "./NotFound.tsx"

export const Instance: FunctionalComponent = () => {
  const {
    params: { name, id },
  } = useRoute()

  const [getDeclFromDeclName, declsLoaded] = useGetDeclFromDeclName()
  const entityFromRoute = useEntityFromRoute()
  const [instanceNamesByEntity] = useInstanceNamesByEntity()
  const [instance, setInstance] = useState<InstanceContainer>()
  const [originalInstance, setOriginalInstance] = useState<InstanceContainer>()

  const { route } = useLocation()

  useEffect(() => {
    if (entityFromRoute?.entity && instance?.content && id) {
      const defaultName = id
      const instanceName = getSerializedDisplayNameFromEntityInstance(
        entityFromRoute.entity,
        instance.content,
        defaultName,
      )
      const entityName = entityFromRoute.entity.name
      document.title = instanceName + " — " + toTitleCase(entityName) + " — TSONDB"
    } else {
      document.title = "Not found — TSONDB"
    }
  }, [entityFromRoute?.entity, id, instance?.content])

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

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (event.submitter?.getAttribute("name") === "save" && name && id && instance) {
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

  const handleOnChange = useCallback((value: unknown) => {
    setInstance(container => container && { ...container, content: value })
  }, [])

  if (!name || !id) {
    return <NotFound />
  }

  if (
    !entityFromRoute ||
    !instance ||
    !originalInstance ||
    !instanceNamesByEntity ||
    !declsLoaded
  ) {
    return (
      <Layout
        breadcrumbs={[
          { url: "/", label: homeTitle },
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
        { url: "/", label: homeTitle },
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
          path={undefined}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={handleOnChange}
        />
        <div class="form-footer btns">
          <button type="submit" name="save" class="primary">
            Save
          </button>
        </div>
      </form>
    </Layout>
  )
}
