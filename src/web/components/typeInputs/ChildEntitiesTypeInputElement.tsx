import type { FunctionComponent } from "preact"
import type { UnsafeEntityTaggedInstanceContainerWithChildInstances } from "../../../node/utils/childInstances.ts"
import type { SerializedEntityDecl } from "../../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedChildEntitiesType } from "../../../shared/schema/types/ChildEntitiesType.ts"
import { getSerializedDisplayNameFromEntityInstance } from "../../../shared/utils/displayName.ts"
import type { InstanceContent } from "../../../shared/utils/instances.ts"
import { useBoolean } from "../../hooks/useBoolean.ts"
import type { UserSettings } from "../../hooks/useSettings.ts"
import { TypeInput, type TypeInputProps } from "./TypeInput.tsx"

type Props = TypeInputProps<SerializedChildEntitiesType> & {
  item: {
    childEntity: SerializedEntityDecl
    item: UnsafeEntityTaggedInstanceContainerWithChildInstances
    locales: string[]
    originalIndex: number
    defaultFolding: UserSettings["defaultFolding"]
    onChildDuplicate: (index: number) => void
    onChildRemove: (index: number) => void
    onChildChange: (index: number, value: InstanceContent) => void
    onGrandChildrenChange: (
      index: number,
      newChildren: (
        oldInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[],
      ) => UnsafeEntityTaggedInstanceContainerWithChildInstances[],
    ) => void
    index: number
  }
}

export const ChildEntitiesTypeInputElement: FunctionComponent<Props> = props => {
  const {
    item: {
      childEntity,
      item,
      originalIndex,
      locales,
      index,
      defaultFolding,
      onChildDuplicate,
      onChildRemove,
      onChildChange,
      onGrandChildrenChange,
    },
    disabled,
  } = props
  const [isEditorVisible, toggleIsEditorVisible] = useBoolean(defaultFolding === "expanded")

  const defaultName = `${String(index + 1)}.`
  const childInstanceName = getSerializedDisplayNameFromEntityInstance(
    childEntity,
    item.content,
    defaultName,
    locales,
  ).name

  return (
    <li class="container-item array-item child-entity-item">
      <div className="container-item-header">
        <div className="container-item-title">
          <strong>{childInstanceName}</strong>
          {item.id ? <span class="id">{item.id}</span> : null}
        </div>
        <div class="container-item-actions">
          <button
            onClick={() => {
              toggleIsEditorVisible()
            }}
            disabled={disabled}
          >
            {isEditorVisible ? "Collapse" : "Expand"}
          </button>
          <button
            onClick={() => {
              onChildDuplicate(index)
            }}
            disabled={disabled}
          >
            Duplicate
          </button>
          <button
            class="destructive"
            onClick={() => {
              onChildRemove(index)
            }}
            disabled={disabled}
          >
            Delete
          </button>
        </div>
      </div>
      {isEditorVisible && (
        <TypeInput
          {...props}
          type={childEntity.type}
          value={item.content}
          parentKey={childEntity.parentReferenceKey}
          onChange={newItem => {
            onChildChange(originalIndex, newItem as InstanceContent) // guaranteed to be an object because of the ObjectType in the child entity
          }}
          childInstances={item.childInstances}
          setChildInstances={newChildInstances => {
            onGrandChildrenChange(originalIndex, newChildInstances)
          }}
        />
      )}
    </li>
  )
}
