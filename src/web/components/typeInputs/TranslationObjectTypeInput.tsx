import type { FunctionComponent } from "preact"
import {
  getSerializedTypeOfKey,
  type SerializedTranslationObjectType,
} from "../../../shared/schema/types/TranslationObjectType.ts"
import { sortObjectKeys } from "../../../shared/utils/object.ts"
import { validateUnknownKeys } from "../../../shared/validation/object.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedTranslationObjectType, Record<string, unknown>>

export const TranslationObjectTypeInput: FunctionComponent<Props> = props => {
  const { type, path, value, parentKey, disabled, getDeclFromDeclName, onChange } = props

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return <MismatchingTypeError expected="object" actual={value} />
  }

  const errors = validateUnknownKeys(Object.keys(type.properties), Object.keys(value))

  return (
    <div class={"field field--container field--object" + (disabled ? " field--disabled" : "")}>
      <ul>
        {Object.entries(type.properties)
          .filter(([key]) => key !== parentKey)
          .map(([key, memberDecl]) => {
            const keyType = getSerializedTypeOfKey(memberDecl, type)
            return (
              <li
                class={
                  "container-item object-item object-item--translation" +
                  (memberDecl === null ? "" : "object-item--translation-object")
                }
                key={key}
              >
                <div className="container-item-title">{key}</div>
                {type.allKeysAreRequired ||
                (value as Record<string, unknown>)[key] !== undefined ? (
                  <TypeInput
                    {...props}
                    inTranslationObject
                    parentKey={undefined}
                    type={keyType}
                    path={path === undefined ? key : `${path}.${key}`}
                    value={
                      (value as Record<string, unknown>)[key] ??
                      (type.allKeysAreRequired
                        ? createTypeSkeleton(getDeclFromDeclName, keyType)
                        : undefined)
                    }
                    onChange={newItem => {
                      onChange(
                        sortObjectKeys({ ...value, [key]: newItem }, Object.keys(type.properties)),
                      )
                    }}
                  />
                ) : null}
                {type.allKeysAreRequired ? null : (value as Record<string, unknown>)[key] ===
                  undefined ? (
                  <button
                    onClick={() => {
                      onChange(
                        sortObjectKeys(
                          {
                            ...value,
                            [key]: createTypeSkeleton(getDeclFromDeclName, keyType),
                          },
                          Object.keys(type.properties),
                        ),
                      )
                    }}
                    disabled={disabled}
                  >
                    Add
                  </button>
                ) : (
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
                    Remove
                  </button>
                )}
              </li>
            )
          })}
      </ul>
      <ValidationErrors disabled={disabled} errors={errors} />
    </div>
  )
}
