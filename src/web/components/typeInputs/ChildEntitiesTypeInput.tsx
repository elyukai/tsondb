import type { FunctionComponent } from "preact"
import type { UnsafeEntityTaggedInstanceContainerWithChildInstances } from "../../../node/utils/childInstances.ts"
import { isSerializedEntityDecl } from "../../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedChildEntitiesType } from "../../../shared/schema/types/ChildEntitiesType.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"

type Props = TypeInputProps<SerializedChildEntitiesType>

export const ChildEntitiesTypeInput: FunctionComponent<Props> = props => {
  const {
    type,
    path,
    childInstances,
    disabled,
    getDeclFromDeclName,
    onChildAdd,
    onChildChange,
    onChildRemove,
  } = props

  const childEntity = getDeclFromDeclName(type.entity)

  const childInstancesForEntity = childInstances
    .map(
      (childInstance, index): [UnsafeEntityTaggedInstanceContainerWithChildInstances, number] => [
        childInstance,
        index,
      ],
    )
    .filter(([childInstance]) => childInstance.entityName === type.entity)

  if (childEntity === undefined || !isSerializedEntityDecl(childEntity)) {
    return (
      <div role="alert">
        Unresolved entity declaration identifier <code>{type.entity}</code>
      </div>
    )
  }

  if (path === undefined) {
    return <div role="alert">A child entities type cannot be the root type of a document.</div>
  }

  return (
    <div class="field field--container field--array">
      {childInstancesForEntity.length > 0 ? (
        <ol>
          {childInstancesForEntity.map(([item, originalIndex], i) => (
            <li class="container-item array-item" key={i}>
              <div className="container-item-header">
                <div className="container-item-title">{i + 1}.</div>
                <button
                  class="destructive"
                  onClick={() => {
                    onChildRemove(i)
                  }}
                  disabled={disabled}
                >
                  Delete Item
                </button>
              </div>
              <TypeInput
                {...props}
                type={childEntity.type}
                value={item.content}
                parentKey={childEntity.parentReferenceKey}
                onChange={newItem => {
                  onChildChange(originalIndex, newItem)
                }}
                childInstances={item.childInstances}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p class="empty">No child entities</p>
      )}
      <div class="add-item-container">
        <button
          onClick={() => {
            onChildAdd(type.entity, createTypeSkeleton(getDeclFromDeclName, childEntity.type))
          }}
          disabled={disabled}
        >
          Add Item
        </button>
      </div>
    </div>
  )
}
