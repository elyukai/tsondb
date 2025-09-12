import type { FunctionComponent } from "preact"
import { useState } from "preact/hooks"
import type { SerializedNestedEntityMapType } from "../../../node/schema/types/references/NestedEntityMapType.ts"
import { sortObjectKeysAlphabetically } from "../../../shared/utils/object.ts"
import { toTitleCase } from "../../../shared/utils/string.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { Select } from "../Select.tsx"
import { TypeInput } from "./TypeInput.tsx"

type Props = {
  type: SerializedNestedEntityMapType
  value: Record<string, unknown>
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: Record<string, unknown>) => void
}

export const NestedEntityMapTypeInput: FunctionComponent<Props> = ({
  type,
  value,
  instanceNamesByEntity,
  getDeclFromDeclName,
  onChange,
}) => {
  const [newKey, setNewKey] = useState("")
  const existingKeys = Object.keys(value)
  const secondaryInstances = (instanceNamesByEntity[type.secondaryEntity] ?? [])
    .slice()
    .filter(instance => !existingKeys.includes(instance.id))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  return (
    <div class="field field--container field--nestedentitymap">
      {existingKeys.length > 0 && (
        <ul>
          {Object.entries(value).map(([key, item]) => {
            const name =
              instanceNamesByEntity[type.secondaryEntity]?.find(instance => instance.id === key)
                ?.name ?? key

            return (
              <li class="container-item dict-item" key={key}>
                <div className="container-item-header">
                  <div className="container-item-title">
                    <span>
                      <strong>{name}</strong> <span className="id">{key}</span>
                    </span>
                  </div>
                  <div className="btns">
                    <button
                      class="destructive"
                      onClick={() => {
                        const newObj = { ...value }
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete newObj[key]
                        onChange(newObj)
                      }}
                    >
                      Delete {name}
                    </button>
                  </div>
                </div>
                <TypeInput
                  type={type.type}
                  value={item}
                  instanceNamesByEntity={instanceNamesByEntity}
                  getDeclFromDeclName={getDeclFromDeclName}
                  onChange={newItem => {
                    onChange(sortObjectKeysAlphabetically({ ...value, [key]: newItem }))
                  }}
                />
              </li>
            )
          })}
        </ul>
      )}
      <div class="add-item-container">
        <Select
          value={newKey}
          onInput={event => {
            setNewKey(event.currentTarget.value)
          }}
          disabled={secondaryInstances.length === 0}
        >
          {secondaryInstances.length === 0 ? (
            <option value="" disabled>
              No instances available
            </option>
          ) : (
            <option value="" disabled>
              No selected instance
            </option>
          )}
          {secondaryInstances.map(instance => (
            <option key={instance.id} value={instance.id}>
              {instance.name}
            </option>
          ))}
        </Select>
        <button
          onClick={() => {
            onChange(
              sortObjectKeysAlphabetically({
                ...value,
                [newKey]: createTypeSkeleton(getDeclFromDeclName, type.type),
              }),
            )
            setNewKey("")
          }}
          disabled={newKey === ""}
        >
          Add {newKey === "" ? "Key" : toTitleCase(newKey)}
        </button>
      </div>
    </div>
  )
}
