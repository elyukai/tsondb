import type { FunctionComponent } from "preact"
import type { SerializedReferenceIdentifierType } from "../../../node/schema/types/references/ReferenceIdentifierType.js"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.js"
import { Select } from "../Select.js"
import { ValidationErrors } from "./utils/ValidationErrors.js"

type Props = {
  type: SerializedReferenceIdentifierType
  value: string
  instanceNamesByEntity: InstanceNamesByEntity
  onChange: (value: string) => void
}

export const ReferenceIdentifierTypeInput: FunctionComponent<Props> = ({
  type,
  value,
  instanceNamesByEntity,
  onChange,
}) => {
  const instances = (instanceNamesByEntity[type.entity] ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div class="field">
      <Select
        value={value}
        onInput={event => {
          onChange(event.currentTarget.value)
        }}
        disabled={instances.length === 0}
        aria-invalid={!value}
      >
        {instances.length === 0 ? (
          <option value="" disabled>
            No instances available
          </option>
        ) : (
          <option value="" disabled>
            No selected instance
          </option>
        )}
        {instances.map(instance => (
          <option key={instance.id} value={instance.id}>
            {instance.name}
          </option>
        ))}
      </Select>
      <ValidationErrors errors={!value ? [ReferenceError("no reference provided")] : []} />
    </div>
  )
}
