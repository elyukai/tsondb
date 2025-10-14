import type { ComponentChildren } from "preact"
import { useLocation } from "preact-iso"
import type { InstanceContainerOverview } from "../../../shared/utils/instances.ts"
import { GitStatusIndicator } from "./GitStatusIndicator.tsx"

export type GitEntityOverview = [
  entityName: string,
  entityNamePlural: string,
  instances: InstanceContainerOverview[],
]

type Props<A extends string> = {
  filesByEntity: GitEntityOverview[]
  fileButtons: { label: string; action: A }[]
  onFileButtonClick: (
    entityName: string,
    instance: InstanceContainerOverview,
    action: A,
  ) => Promise<void>
}

export const GitFileList: <A extends string>(props: Props<A>) => ComponentChildren = ({
  filesByEntity,
  onFileButtonClick,
  fileButtons,
}) => {
  const { route } = useLocation()
  return filesByEntity.length === 0 ? (
    <p class="no-changes">No changes</p>
  ) : (
    <ul class="git-entity-list">
      {filesByEntity.map(([entityName, entityNamePlural, instances]) => (
        <li key={entityName} class="git-entity-list-item">
          <span class="title">{entityNamePlural}</span>
          <ul class="git-instance-list">
            {instances.map(instance => (
              <li key={instance.id} class="form-row form-row--compact git-instance-list-item">
                <span class="title form-row__fill">{instance.displayName}</span>
                <GitStatusIndicator status={instance.gitStatus} />
                <button
                  onClick={() => {
                    route(`/entities/${entityName}/instances/${instance.id}`)
                  }}
                  disabled={
                    (instance.gitStatus?.index === "D" && instance.gitStatus.workingDir === " ") ||
                    instance.gitStatus?.workingDir === "D"
                  }
                >
                  View
                </button>
                {fileButtons.map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={() => {
                      void onFileButtonClick(entityName, instance, action)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
