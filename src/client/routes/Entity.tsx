import { FunctionalComponent } from "preact"
import { useRoute } from "preact-iso"
import { useEffect, useState } from "preact/hooks"
import { SerializedEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { getDisplayNameFromEntityInstance } from "../../shared/utils/displayName.js"
import { getGitStatusForDisplay, getLabelForGitStatus } from "../../shared/utils/git.js"
import { InstanceContainer } from "../../shared/utils/instances.js"
import {
  deleteInstanceByEntityNameAndId,
  getEntityByName,
  getInstancesByEntityName,
} from "../api.js"
import { Layout } from "../components/Layout.js"
import { NotFound } from "./NotFound.js"

export const Entity: FunctionalComponent = () => {
  const {
    params: { name },
    query: { created },
  } = useRoute()

  const [entity, setEntity] = useState<{
    declaration: SerializedEntityDecl
    isLocaleEntity: boolean
  }>()
  const [instances, setInstances] = useState<InstanceContainer[]>()

  useEffect(() => {
    if (name) {
      Promise.all([getEntityByName(name), getInstancesByEntityName(name)])
        .then(([entityData, instancesData]) => {
          setEntity(entityData)
          setInstances(instancesData.instances)
        })
        .catch(error => {
          console.error("Error fetching entities:", error)
        })
    }

    if (created) {
      const instanceElement = document.getElementById(`instance-${created}`)
      if (instanceElement) {
        instanceElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [])

  if (!name) {
    return <NotFound />
  }

  if (!entity || !instances) {
    return (
      <div>
        <h1>{name}</h1>
        <p className="loading">Loading …</p>
      </div>
    )
  }

  return (
    <Layout breadcrumbs={[{ url: "/", label: "Home" }]}>
      <div class="header-with-btns">
        <h1>{name}</h1>
        <a class="btn btn--primary" href={`/entities/${entity.declaration.name}/instances/create`}>
          Add
        </a>
      </div>
      {entity.declaration.comment && <p className="description">{entity.declaration.comment}</p>}
      <p>
        {instances.length} instance{instances.length === 1 ? "" : "s"}
      </p>
      <ul class="instances">
        {instances.map(instance => {
          const gitStatusForDisplay = getGitStatusForDisplay(instance.gitStatus)
          return (
            <li
              key={instance.id}
              id={`instance-${instance.id}`}
              class={`instance-item ${created === instance.id ? "instance-item--created" : ""} ${
                gitStatusForDisplay === undefined ? "" : `git-status--${gitStatusForDisplay}`
              }`}
            >
              <h2>
                {getDisplayNameFromEntityInstance(
                  entity.declaration,
                  instance.content,
                  instance.id,
                )}
              </h2>
              <p aria-hidden class="id">
                {instance.id}
              </p>
              {gitStatusForDisplay !== undefined && (
                <p
                  class={`git-status git-status--${gitStatusForDisplay}`}
                  title={getLabelForGitStatus(gitStatusForDisplay)}
                >
                  {gitStatusForDisplay}
                </p>
              )}
              <div className="btns">
                <a
                  href={`/entities/${entity.declaration.name}/instances/${instance.id}`}
                  class="btn"
                >
                  Edit
                </a>
                <button
                  class="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this instance?")) {
                      deleteInstanceByEntityNameAndId(entity.declaration.name, instance.id)
                        .then(() => {
                          setInstances(instances.filter(i => i.id !== instance.id))
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
            </li>
          )
        })}
      </ul>
    </Layout>
  )
}
