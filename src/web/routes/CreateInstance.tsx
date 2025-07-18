import type { FunctionalComponent } from "preact"
import { useLocation, useRoute } from "preact-iso"
import { useEffect, useState } from "preact/hooks"
import { getDisplayNameFromEntityInstance } from "../../shared/utils/displayName.ts"
import { toTitleCase } from "../../shared/utils/string.ts"
import { validateLocaleIdentifier } from "../../shared/validation/identifier.ts"
import { createInstanceByEntityNameAndId } from "../api.ts"
import { Layout } from "../components/Layout.ts"
import { TypeInput } from "../components/typeInputs/TypeInput.ts"
import { ValidationErrors } from "../components/typeInputs/utils/ValidationErrors.tsx"
import { useEntityFromRoute } from "../hooks/useEntityFromRoute.ts"
import { useInstanceNamesByEntity } from "../hooks/useInstanceNamesByEntity.ts"
import { useGetDeclFromDeclName } from "../hooks/useSecondaryDeclarations.ts"
import { createTypeSkeleton } from "../utils/typeSkeleton.ts"
import { NotFound } from "./NotFound.tsx"

export const CreateInstance: FunctionalComponent = () => {
  const {
    params: { name },
  } = useRoute()

  const getDeclFromDeclName = useGetDeclFromDeclName()
  const entityFromRoute = useEntityFromRoute()
  const [instanceNamesByEntity] = useInstanceNamesByEntity()

  const [instance, setInstance] = useState<unknown>()
  const [customId, setCustomId] = useState("")

  useEffect(() => {
    if (entityFromRoute) {
      setInstance(createTypeSkeleton(getDeclFromDeclName, entityFromRoute.entity.type))
    }
  }, [getDeclFromDeclName, entityFromRoute])

  const { route } = useLocation()

  if (!name) {
    return <NotFound />
  }

  if (!entityFromRoute) {
    return (
      <div>
        <h1>{name}</h1>
        <p className="loading">Loading …</p>
      </div>
    )
  }

  const { entity, isLocaleEntity } = entityFromRoute

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    const name = event.submitter?.getAttribute("name")
    if (name) {
      createInstanceByEntityNameAndId(entity.name, instance, isLocaleEntity ? customId : undefined)
        .then(createdInstance => {
          if (name === "saveandaddanother") {
            setInstance(createTypeSkeleton(getDeclFromDeclName, entity.type))
            setCustomId("")
            alert(
              `Instance of entity ${entity.name} created successfully with identifier ${createdInstance.instance.id}. You can add another instance now.`,
            )
          } else {
            route(
              `/entities/${entity.name}?created=${encodeURIComponent(createdInstance.instance.id)}`,
            )
          }
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            alert(`Error creating instance:\n\n${error.toString()}`)
          }
        })
    }
  }

  const defaultName = customId || `New ${toTitleCase(entity.name)}`
  const instanceName = getDisplayNameFromEntityInstance(entity, instance, defaultName)
  const idErrors = isLocaleEntity ? validateLocaleIdentifier(customId) : []

  return (
    <Layout
      breadcrumbs={[
        { url: "/", label: "Home" },
        { url: `/entities/${entity.name}`, label: entity.name },
      ]}
    >
      <div class="header-with-btns">
        <h1 class={instanceName.length === 0 ? "empty-name" : undefined}>
          {instanceName || defaultName}
        </h1>
      </div>
      {isLocaleEntity && (
        <div class="field field--id">
          <label htmlFor="id">ID</label>
          <p className="comment">The instance’s identifier. An IETF language tag (BCP47).</p>
          <input
            type="text"
            id="id"
            value={customId}
            required
            pattern="[a-z]{2,3}(-[A-Z]{2,3})?"
            placeholder="en-US, de-DE, …"
            onInput={event => {
              setCustomId(event.currentTarget.value)
            }}
            aria-invalid={idErrors.length > 0}
          />
          <ValidationErrors errors={idErrors} />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <TypeInput
          type={entity.type}
          value={instance}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={value => {
            console.log("onChange", value)
            setInstance(value)
          }}
        />
        <div className="btns">
          <button type="submit" class="primary" name="save">
            Save
          </button>
          <button type="submit" class="primary" name="saveandaddanother">
            Save and Add Another
          </button>
        </div>
      </form>
    </Layout>
  )
}
