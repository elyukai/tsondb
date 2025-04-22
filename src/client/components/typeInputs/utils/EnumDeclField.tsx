import { FunctionComponent } from "preact"
import { SerializedEnumDecl } from "../../../../schema/declarations/EnumDecl.js"
import { discriminatorKey } from "../../../../shared/enum.js"
import { toTitleCase } from "../../../../shared/utils/string.js"
import { InstanceNamesByEntity } from "../../../hooks/useInstanceNamesByEntity.js"
import { GetDeclFromDeclName } from "../../../hooks/useSecondaryDeclarations.js"
import { createTypeSkeleton } from "../../../utils/typeSkeleton.js"
import { Select } from "../../Select.js"
import { TypeInput } from "../TypeInput.js"
import { MismatchingTypeError } from "./MismatchingTypeError.js"

type Props = {
  decl: SerializedEnumDecl
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown) => void
}

export const EnumDeclField: FunctionComponent<Props> = ({
  decl,
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

  const enumValues = Object.keys(decl.values)
  const activeEnumCase = value[discriminatorKey]
  const associatedType = decl.values[activeEnumCase]

  return (
    <div class="field field--enum">
      <Select
        value={activeEnumCase}
        onInput={event => {
          const associatedType = decl.values[event.currentTarget.value]
          if (associatedType == null) {
            onChange({
              [discriminatorKey]: event.currentTarget.value,
            })
          } else {
            onChange({
              [discriminatorKey]: event.currentTarget.value,
              [event.currentTarget.value]: createTypeSkeleton(getDeclFromDeclName, associatedType),
            })
          }
        }}
      >
        {enumValues.map(enumValue => (
          <option value={enumValue} selected={enumValue === activeEnumCase}>
            {toTitleCase(enumValue)}
          </option>
        ))}
      </Select>
      {associatedType == null ? null : (
        <div className="associated-type">
          <TypeInput
            type={associatedType}
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
