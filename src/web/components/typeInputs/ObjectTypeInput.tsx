import type { FunctionComponent } from "preact"
import type { SerializedObjectType } from "../../../node/schema/types/generic/ObjectType.ts"
import { sortObjectKeys } from "../../../shared/utils/object.ts"
import { toTitleCase } from "../../../shared/utils/string.ts"
import { validateObjectConstraints } from "../../../shared/validation/object.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { Markdown } from "../../utils/Markdown.tsx"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { TypeInput } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = {
  type: SerializedObjectType
  path: string | undefined
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: Record<string, unknown>) => void
}

export const ObjectTypeInput: FunctionComponent<Props> = ({
  type,
  path,
  value,
  instanceNamesByEntity,
  getDeclFromDeclName,
  onChange,
}) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return <MismatchingTypeError expected="object" actual={value} />
  }

  const errors = validateObjectConstraints(type, Object.keys(type.properties), value)

  return (
    <div class="field field--container field--object">
      <ul>
        {Object.entries(type.properties).map(([key, memberDecl]) => (
          <li class="container-item object-item" key={key}>
            <div className="container-item-header">
              <div className="container-item-title">
                <strong>{toTitleCase(key)}</strong>
                {memberDecl.comment === undefined ? null : (
                  <Markdown class="comment" string={memberDecl.comment} />
                )}
              </div>
              {memberDecl.isRequired ? null : (value as Record<string, unknown>)[key] ===
                undefined ? (
                <button
                  onClick={() => {
                    onChange(
                      sortObjectKeys(
                        {
                          ...value,
                          [key]: createTypeSkeleton(getDeclFromDeclName, memberDecl.type),
                        },
                        Object.keys(type.properties),
                      ),
                    )
                  }}
                >
                  Add {toTitleCase(key)}
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
                >
                  Remove {toTitleCase(key)}
                </button>
              )}
            </div>
            {memberDecl.isRequired || (value as Record<string, unknown>)[key] !== undefined ? (
              <TypeInput
                type={memberDecl.type}
                path={path === undefined ? key : `${path}.${key}`}
                value={value[key as keyof typeof value]}
                instanceNamesByEntity={instanceNamesByEntity}
                getDeclFromDeclName={getDeclFromDeclName}
                onChange={newItem => {
                  onChange(
                    sortObjectKeys({ ...value, [key]: newItem }, Object.keys(type.properties)),
                  )
                }}
              />
            ) : null}
          </li>
        ))}
      </ul>
      <ValidationErrors errors={errors} />
    </div>
  )
}
