import type { FunctionComponent } from "preact"
import { useCallback } from "preact/hooks"
import type { UnsafeEntityTaggedInstanceContainerWithChildInstances } from "../../../node/utils/childInstances.ts"
import { isSerializedEntityDecl } from "../../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedChildEntitiesType } from "../../../shared/schema/types/ChildEntitiesType.ts"
import { removeAt } from "../../../shared/utils/array.ts"
import type { InstanceContent } from "../../../shared/utils/instances.ts"
import { useSetting } from "../../hooks/useSettings.ts"
import { createTypeSkeleton } from "../../utils/typeSkeleton.ts"
import { ChildEntitiesTypeInputElement } from "./ChildEntitiesTypeInputElement.tsx"
import { type TypeInputProps } from "./TypeInput.tsx"

type Props = TypeInputProps<SerializedChildEntitiesType>

export const ChildEntitiesTypeInput: FunctionComponent<Props> = props => {
  const [locales] = useSetting("displayedLocales")
  const [defaultFolding] = useSetting("defaultFolding")

  const { type, path, childInstances, disabled, getDeclFromDeclName, setChildInstances } = props

  const childEntity = getDeclFromDeclName(type.entity)

  const childInstancesForEntity = childInstances
    .map(
      (childInstance, index): [UnsafeEntityTaggedInstanceContainerWithChildInstances, number] => [
        childInstance,
        index,
      ],
    )
    .filter(([childInstance]) => childInstance.entityName === type.entity)

  const onChildChange = useCallback(
    (index: number, value: InstanceContent) => {
      setChildInstances(old =>
        old[index] ? old.with(index, { ...old[index], content: value }) : old,
      )
    },
    [setChildInstances],
  )

  const onGrandChildrenChange = useCallback(
    (
      index: number,
      newChildren: (
        oldInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[],
      ) => UnsafeEntityTaggedInstanceContainerWithChildInstances[],
    ) => {
      setChildInstances(old =>
        old[index]
          ? old.with(index, {
              ...old[index],
              childInstances: newChildren(old[index].childInstances),
            })
          : old,
      )
    },
    [setChildInstances],
  )

  const onChildAdd = useCallback(
    (entityName: string, value: InstanceContent) => {
      setChildInstances(old => [
        ...old,
        { entityName, childInstances: [], id: undefined, content: value },
      ])
    },
    [setChildInstances],
  )

  const onChildDuplicate = useCallback(
    (index: number) => {
      const setChildInstancesAsNew = (
        childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[],
      ): UnsafeEntityTaggedInstanceContainerWithChildInstances[] =>
        childInstances.map(ci => ({
          ...ci,
          childInstances: setChildInstancesAsNew(ci.childInstances),
          id: undefined,
        }))

      setChildInstances(old =>
        old[index]
          ? [
              ...old,
              {
                ...old[index],
                childInstances: setChildInstancesAsNew(old[index].childInstances),
                id: undefined,
              },
            ]
          : old,
      )
    },
    [setChildInstances],
  )

  const onChildRemove = useCallback(
    (index: number) => {
      setChildInstances(old => removeAt(old, index))
    },
    [setChildInstances],
  )

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
    <div class="field field--container field--array field--child-entities">
      {childInstancesForEntity.length > 0 ? (
        <ol>
          {childInstancesForEntity.map(([item, originalIndex], index) => (
            <ChildEntitiesTypeInputElement
              key={index}
              {...props}
              item={{
                index,
                originalIndex,
                item,
                childEntity,
                locales,
                defaultFolding,
                onChildChange,
                onGrandChildrenChange,
                onChildDuplicate,
                onChildRemove,
              }}
            />
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
