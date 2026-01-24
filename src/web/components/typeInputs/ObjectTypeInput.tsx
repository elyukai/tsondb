import { sortObjectKeysByIndex } from "@elyukai/utils/object"
import { toTitleCase } from "@elyukai/utils/string"
import type { FunctionComponent } from "preact"
import type { SerializedObjectType } from "../../../shared/schema/types/ObjectType.ts"
import { isSinglularInputFieldType } from "../../../shared/schema/types/Type.ts"
import { validateObjectConstraints } from "../../../shared/validation/object.ts"
import { Markdown } from "../../utils/Markdown.tsx"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedObjectType, Record<string, unknown>>

export const ObjectTypeInput: FunctionComponent<Props> = props => {
  const { type, path, value, parentKey, disabled, getDeclFromDeclName, onChange } = props

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return <MismatchingTypeError expected="object" actual={value} />
  }

  const errors = validateObjectConstraints(type, Object.keys(type.properties), value)
  const hasOnlySimpleItems = Object.values(type.properties).every(memberDecl =>
    isSinglularInputFieldType(getDeclFromDeclName, memberDecl.type),
  )

  return (
    <div
      class={
        "field field--container field--object" +
        (disabled ? " field--disabled" : "") +
        (hasOnlySimpleItems ? " field--simple-container field--simple-object" : "")
      }
    >
      <ul>
        {Object.entries(type.properties)
          .filter(([key]) => key !== parentKey)
          .map(([key, memberDecl]) => {
            const isSimpleItem = isSinglularInputFieldType(getDeclFromDeclName, memberDecl.type)
            return (
              <li
                class={"container-item object-item" + (isSimpleItem ? " simple-item" : "")}
                key={key}
              >
                <div className="container-item-title">
                  <strong>{memberDecl.displayName ?? toTitleCase(key)}</strong>
                  {memberDecl.comment === undefined ? null : (
                    <Markdown class="comment" string={memberDecl.comment} />
                  )}
                </div>
                {memberDecl.isRequired ? null : (value as Record<string, unknown>)[key] ===
                  undefined ? (
                  <div className="container-item-actions">
                    <button
                      onClick={() => {
                        onChange(
                          sortObjectKeysByIndex(
                            {
                              ...value,
                              [key]: createTypeSkeleton(getDeclFromDeclName, memberDecl.type),
                            },
                            Object.keys(type.properties),
                          ),
                        )
                      }}
                      disabled={disabled}
                    >
                      Add {memberDecl.displayName ?? toTitleCase(key)}
                    </button>
                  </div>
                ) : (
                  <div className="container-item-actions">
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
                      Remove {memberDecl.displayName ?? toTitleCase(key)}
                    </button>
                  </div>
                )}
                {isSimpleItem ||
                memberDecl.isRequired ||
                (value as Record<string, unknown>)[key] !== undefined ? (
                  <TypeInput
                    {...props}
                    parentKey={undefined}
                    type={memberDecl.type}
                    path={path === undefined ? key : `${path}.${key}`}
                    value={
                      (value[key as keyof typeof value] as unknown) ??
                      createTypeSkeleton(getDeclFromDeclName, memberDecl.type)
                    }
                    disabled={
                      props.disabled ||
                      (!memberDecl.isRequired &&
                        (value as Record<string, unknown>)[key] === undefined)
                    }
                    onChange={newItem => {
                      onChange(
                        sortObjectKeysByIndex(
                          { ...value, [key]: newItem },
                          Object.keys(type.properties),
                        ),
                      )
                    }}
                  />
                ) : null}
              </li>
            )
          })}
      </ul>
      <ValidationErrors disabled={disabled} errors={errors} />
    </div>
  )
}
