import type { FunctionComponent } from "preact"
import type { SerializedArrayType } from "../../../node/schema/types/generic/ArrayType.ts"
import { removeAt } from "../../../shared/utils/array.ts"
import { validateArrayConstraints } from "../../../shared/validation/array.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { TypeInput } from "./TypeInput.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = {
  type: SerializedArrayType
  value: unknown[]
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown[]) => void
}

export const ArrayTypeInput: FunctionComponent<Props> = ({
  type,
  value,
  instanceNamesByEntity,
  getDeclFromDeclName,
  onChange,
}) => {
  const errors = validateArrayConstraints(type, value)

  const isTuple = typeof type.minItems === "number" && type.minItems === type.maxItems

  return (
    <div class="field field--container field--array">
      {value.length > 0 && (
        <ol>
          {value.map((item, i) => (
            <li class="container-item array-item" key={i}>
              {isTuple ? null : (
                <div className="container-item-header">
                  <div className="container-item-title">{i + 1}.</div>
                  <button
                    class="destructive"
                    onClick={() => {
                      onChange(removeAt(value, i))
                    }}
                    disabled={type.minItems !== undefined && value.length <= type.minItems}
                  >
                    Delete Item #{i + 1}
                  </button>
                </div>
              )}
              <TypeInput
                type={type.items}
                value={item}
                instanceNamesByEntity={instanceNamesByEntity}
                getDeclFromDeclName={getDeclFromDeclName}
                onChange={newItem => {
                  onChange(value.with(i, newItem))
                }}
              />
            </li>
          ))}
        </ol>
      )}
      {isTuple ? null : (
        <div class="add-item-container">
          <button
            onClick={() => {
              onChange([...value, createTypeSkeleton(getDeclFromDeclName, type.items)])
            }}
            disabled={type.maxItems !== undefined && value.length >= type.maxItems}
          >
            Add Item #{value.length + 1}
          </button>
        </div>
      )}
      <ValidationErrors errors={errors} />
    </div>
  )
}
