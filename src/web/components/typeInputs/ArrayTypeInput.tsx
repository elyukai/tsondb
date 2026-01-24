import { removeAt } from "@elyukai/utils/array/modify"
import type { FunctionComponent } from "preact"
import type { SerializedArrayType } from "../../../shared/schema/types/ArrayType.ts"
import { isSinglularInputFieldType } from "../../../shared/schema/types/Type.ts"
import { validateArrayConstraints } from "../../../shared/validation/array.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedArrayType, unknown[]>

export const ArrayTypeInput: FunctionComponent<Props> = props => {
  const { type, path, value, disabled, getDeclFromDeclName, onChange } = props

  if (!(Array.isArray as (arg: unknown) => arg is unknown[])(value)) {
    return <MismatchingTypeError expected="array" actual={value} />
  }

  const errors = validateArrayConstraints(type, value)

  const isTuple = typeof type.minItems === "number" && type.minItems === type.maxItems
  const hasOnlySimpleItems = isSinglularInputFieldType(getDeclFromDeclName, type.items)

  return (
    <div
      class={
        "field field--container field--array" +
        (disabled ? " field--disabled" : "") +
        (hasOnlySimpleItems ? " field--simple-container field--simple-array" : "")
      }
    >
      {value.length > 0 && (
        <ol>
          {value.map((item, i) => (
            <li
              class={"container-item array-item" + (hasOnlySimpleItems ? " simple-item" : "")}
              key={i}
            >
              {isTuple ? null : (
                <>
                  <div className="container-item-title">{i + 1}.</div>
                  <div className="container-item-actions">
                    <button
                      class="destructive"
                      onClick={() => {
                        onChange(removeAt(value, i))
                      }}
                      disabled={
                        disabled || (type.minItems !== undefined && value.length <= type.minItems)
                      }
                    >
                      Delete Item #{i + 1}
                    </button>
                  </div>
                </>
              )}
              <TypeInput
                {...props}
                parentKey={undefined}
                type={type.items}
                path={path === undefined ? `[${i.toString()}]` : `${path}[${i.toString()}]`}
                value={item}
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
            disabled={disabled || (type.maxItems !== undefined && value.length >= type.maxItems)}
          >
            Add Item #{value.length + 1}
          </button>
        </div>
      )}
      <ValidationErrors disabled={disabled} errors={errors} />
    </div>
  )
}
