import { FunctionComponent } from "preact"
import { useState } from "preact/hooks"
import { SerializedNestedEntityMapType } from "../../../schema/types/references/NestedEntityMapType.js"
import { sortObjectKeysAlphabetically } from "../../../shared/utils/object.js"
import { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.js"
import { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.js"
import { createTypeSkeleton } from "../../utils/typeSkeleton.js"
import { Select } from "../Select.js"
import { TypeInput } from "./TypeInput.js"

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
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div class="field field--container field--nestedentitymap">
      {existingKeys.length > 0 && (
        <ul>
          {Object.entries(value).map(([key, item]) => (
            <li class="container-item dict-item" key={key}>
              <div className="container-item-header">
                <div className="container-item-title">
                  <span>
                    <strong>
                      {instanceNamesByEntity[type.secondaryEntity]!.find(
                        instance => instance.id === key,
                      )?.name ?? key}
                    </strong>{" "}
                    <span className="id">{key}</span>
                  </span>
                </div>
                <div className="btns">
                  <button
                    class="destructive"
                    onClick={() => {
                      const newObj = { ...value }
                      delete newObj[key]
                      onChange(newObj)
                    }}
                  >
                    Delete Key
                  </button>
                </div>
              </div>
              <TypeInput
                type={type.type}
                value={item}
                instanceNamesByEntity={instanceNamesByEntity}
                getDeclFromDeclName={getDeclFromDeclName}
                onChange={newItem =>
                  onChange(sortObjectKeysAlphabetically({ ...value, [key]: newItem }))
                }
              />
            </li>
          ))}
        </ul>
      )}
      <div class="add-item-container">
        <Select
          value={newKey}
          onInput={event => setNewKey(event.currentTarget.value)}
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
            <option value={instance.id}>{instance.name}</option>
          ))}
        </Select>
        <button
          onClick={() => {
            onChange(
              sortObjectKeysAlphabetically({
                ...value,
                [newKey as string]: createTypeSkeleton(getDeclFromDeclName, type.type),
              }),
            )
            setNewKey("")
          }}
          disabled={newKey === ""}
        >
          Add Key
        </button>
      </div>
    </div>
  )
}
