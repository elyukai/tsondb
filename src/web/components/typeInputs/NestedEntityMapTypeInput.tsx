import { sortObjectKeys } from "@elyukai/utils/object"
import { toTitleCase } from "@elyukai/utils/string"
import type { FunctionComponent } from "preact"
import { useState } from "preact/hooks"
import type { SerializedNestedEntityMapType } from "../../../shared/schema/types/NestedEntityMapType.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { Select } from "../Select.tsx"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"

type Props = TypeInputProps<SerializedNestedEntityMapType, Record<string, unknown>>

export const NestedEntityMapTypeInput: FunctionComponent<Props> = props => {
  const {
    type,
    path,
    value,
    instanceNamesByEntity,
    disabled,
    getDeclFromDeclName,
    checkIsLocaleEntity,
    onChange,
  } = props

  const [newKey, setNewKey] = useState("")

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return <MismatchingTypeError expected="object" actual={value} />
  }

  const existingKeys = Object.keys(value)
  const secondaryInstances = (instanceNamesByEntity[type.secondaryEntity] ?? [])
    .slice()
    .filter(instance => !existingKeys.includes(instance.id))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }))

  const isLocaleEntity = checkIsLocaleEntity(type.secondaryEntity)

  return (
    <div class="field field--container field--nestedentitymap">
      {existingKeys.length > 0 && (
        <ul>
          {(Object.entries(value) as [string, unknown][]).map(([key, item]) => {
            const name =
              instanceNamesByEntity[type.secondaryEntity]?.find(instance => instance.id === key)
                ?.displayName ?? key

            return (
              <li
                class="container-item dict-item"
                key={key}
                {...(isLocaleEntity ? { lang: key } : {})}
              >
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
                        delete newObj[key as keyof typeof newObj]
                        onChange(newObj)
                      }}
                      disabled={disabled}
                    >
                      Delete {name}
                    </button>
                  </div>
                </div>
                <TypeInput
                  {...props}
                  parentKey={undefined}
                  type={type.type}
                  path={path === undefined ? key : `${path}.${key}`}
                  value={item}
                  onChange={newItem => {
                    onChange(sortObjectKeys({ ...value, [key]: newItem }))
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
          disabled={disabled || secondaryInstances.length === 0}
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
              {instance.displayName}
            </option>
          ))}
        </Select>
        <button
          onClick={() => {
            onChange(
              sortObjectKeys({
                ...value,
                [newKey]: createTypeSkeleton(getDeclFromDeclName, type.type),
              }),
            )
            setNewKey("")
          }}
          disabled={disabled || newKey === ""}
        >
          Add {newKey === "" ? "Key" : toTitleCase(newKey)}
        </button>
      </div>
    </div>
  )
}
