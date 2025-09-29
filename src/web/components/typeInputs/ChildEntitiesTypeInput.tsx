import type { FunctionComponent } from "preact"
import type { SerializedChildEntitiesType } from "../../../shared/schema/types/ChildEntitiesType.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"

type Props = {
  type: SerializedChildEntitiesType
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown[]) => void
}

export const ChildEntitiesTypeInput: FunctionComponent<Props> = ({
  type,
  value,
  getDeclFromDeclName,
  onChange,
}) => {
  const childEntity = getDeclFromDeclName(type.entity)

  if (childEntity === undefined) {
    return (
      <div role="alert">
        Unresolved declaration identifier <code>{type.entity}</code>
      </div>
    )
  }

  // const isTuple = typeof type.minItems === "number" && type.minItems === type.maxItems

  return (
    <div class="field field--container field--array">
      {/* {value.length > 0 && (
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
                    Delete Item
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
      )} */}
      <div class="add-item-container">
        <button
          onClick={() => {
            onChange([
              ...(value as unknown[]),
              createTypeSkeleton(getDeclFromDeclName, childEntity.type),
            ])
          }}
        >
          Add Item
        </button>
      </div>
    </div>
  )
}
