import type { FunctionComponent } from "preact"
import { discriminatorKey } from "../../../shared/enum.ts"
import type { SerializedEnumType } from "../../../shared/schema/types/EnumType.ts"
import { toTitleCase } from "../../../shared/utils/string.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { Select } from "../Select.tsx"
import { TypeInput } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"

type Props = {
  type: SerializedEnumType
  path: string | undefined
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown) => void
}

export const EnumTypeInput: FunctionComponent<Props> = ({
  type,
  path,
  value,
  instanceNamesByEntity,
  getDeclFromDeclName,
  onChange,
}) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !(discriminatorKey in value) ||
    typeof value[discriminatorKey] !== "string"
  ) {
    return <MismatchingTypeError expected="enumeration value" actual={value} />
  }

  const enumValues = Object.keys(type.values)
  const activeEnumCase = value[discriminatorKey]
  const caseMember = type.values[activeEnumCase]

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
              [event.currentTarget.value]: createTypeSkeleton(getDeclFromDeclName, caseMember.type),
            })
          }
        }}
      >
        {enumValues.map(enumValue => (
          <option key={enumValue} value={enumValue} selected={enumValue === activeEnumCase}>
            {toTitleCase(enumValue)}
          </option>
        ))}
      </Select>
      {caseMember?.type == null ? null : (
        <div className="associated-type">
          <TypeInput
            type={caseMember.type}
            path={path === undefined ? `{${activeEnumCase}}` : `${path}.{${activeEnumCase}}`}
            value={(value as Record<string, unknown>)[activeEnumCase]}
            instanceNamesByEntity={instanceNamesByEntity}
            getDeclFromDeclName={getDeclFromDeclName}
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
}
