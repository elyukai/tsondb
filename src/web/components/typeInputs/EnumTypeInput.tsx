import type { FunctionComponent } from "preact"
import { discriminatorKey } from "../../../shared/enum.ts"
import type { SerializedEnumType } from "../../../shared/schema/types/EnumType.ts"
import { toTitleCase } from "../../../shared/utils/string.ts"
import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import { useSetting } from "../../hooks/useSettings.ts"
import { Markdown } from "../../utils/Markdown.tsx"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { Select } from "../Select.tsx"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"

type Props = TypeInputProps<SerializedEnumType>

export const EnumTypeInput: FunctionComponent<Props> = props => {
  const { type, path, value, disabled, getDeclFromDeclName, onChange } = props

  const [enumDisplay] = useSetting("enumDisplay")

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !(discriminatorKey in value) ||
    typeof value[discriminatorKey] !== "string"
  ) {
    return <MismatchingTypeError expected="enumeration value" actual={value} />
  }

  const enumValues = Object.entries(type.values)
  const activeEnumCase = value[discriminatorKey]
  const activeCaseMember = type.values[activeEnumCase]

  switch (enumDisplay) {
    case "select":
      return (
        <div class="field field--enum">
          <Select
            value={activeEnumCase}
            onInput={event => {
              const caseMember = type.values[event.currentTarget.value]
              if (caseMember?.type == null) {
                onChange({
                  [discriminatorKey]: event.currentTarget.value,
                })
              } else {
                onChange({
                  [discriminatorKey]: event.currentTarget.value,
                  [event.currentTarget.value]: createTypeSkeleton(
                    getDeclFromDeclName,
                    caseMember.type,
                  ),
                })
              }
            }}
            disabled={disabled}
          >
            {enumValues.map(([enumValue]) => (
              <option key={enumValue} value={enumValue} selected={enumValue === activeEnumCase}>
                {toTitleCase(enumValue)}
              </option>
            ))}
          </Select>
          {activeCaseMember?.comment === undefined ? null : (
            <Markdown class="comment" string={activeCaseMember.comment} />
          )}
          {activeCaseMember?.type == null ? null : (
            <div className="associated-type">
              <TypeInput
                {...props}
                parentKey={undefined}
                type={activeCaseMember.type}
                path={path === undefined ? `{${activeEnumCase}}` : `${path}.{${activeEnumCase}}`}
                value={(value as Record<string, unknown>)[activeEnumCase]}
                onChange={newValue => {
                  onChange({
                    [discriminatorKey]: activeEnumCase,
                    [activeEnumCase]: newValue,
                  })
                }}
              />
            </div>
          )}
        </div>
      )

    case "radio":
      return (
        <div class="field field--enum">
          {enumValues.map(([enumValue, caseMember]) => (
            <div class="field--option" key={enumValue}>
              <input
                type="radio"
                name={path}
                value={enumValue}
                id={path === undefined ? enumValue : `${path}-${enumValue}`}
                checked={enumValue === activeEnumCase}
                onInput={() => {
                  if (caseMember.type == null) {
                    onChange({
                      [discriminatorKey]: enumValue,
                    })
                  } else {
                    onChange({
                      [discriminatorKey]: enumValue,
                      [enumValue]: createTypeSkeleton(getDeclFromDeclName, caseMember.type),
                    })
                  }
                }}
                disabled={disabled}
              />
              <div>
                <label htmlFor={path === undefined ? enumValue : `${path}-${enumValue}`}>
                  {toTitleCase(enumValue)}
                </label>
                {caseMember.comment === undefined ? null : (
                  <Markdown class="comment" string={caseMember.comment} />
                )}
              </div>
            </div>
          ))}
          {activeCaseMember?.type == null ? null : (
            <div className="associated-type">
              <TypeInput
                {...props}
                parentKey={undefined}
                type={activeCaseMember.type}
                path={path === undefined ? `{${activeEnumCase}}` : `${path}.{${activeEnumCase}}`}
                value={(value as Record<string, unknown>)[activeEnumCase]}
                onChange={newValue => {
                  onChange({
                    [discriminatorKey]: activeEnumCase,
                    [activeEnumCase]: newValue,
                  })
                }}
              />
            </div>
          )}
        </div>
      )

    default:
      return assertExhaustive(enumDisplay)
  }
}
