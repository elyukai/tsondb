import type { FunctionComponent } from "preact"
import type { InstanceContainerOverview } from "../../../shared/utils/instances.ts"
import { GitStatusIndicator } from "./GitStatusIndicator.tsx"

export type GitEntityOverview = [
  entityName: string,
  entityNamePlural: string,
  instances: InstanceContainerOverview[],
]

type Props = {
  filesByEntity: GitEntityOverview[]
  fileButtonLabel: string
  onFileButtonClick: (entityName: string, instance: InstanceContainerOverview) => Promise<void>
}

export const GitFileList: FunctionComponent<Props> = ({
  filesByEntity,
  onFileButtonClick,
  fileButtonLabel,
}) =>
  filesByEntity.length === 0 ? (
    <p class="no-changes">No changes</p>
  ) : (
    <ul class="git-entity-list">
      {filesByEntity.map(([entityName, entityNamePlural, instances]) => (
        <li key={entityName} class="git-entity-list-item">
          <span class="title">{entityNamePlural}</span>
          <ul class="git-instance-list">
            {instances.map(instance => (
              <li key={instance.id} class="git-instance-list-item">
                <span class="title">{instance.displayName}</span>
                <GitStatusIndicator status={instance.gitStatus} />
                <button
                  onClick={() => {
                    void onFileButtonClick(entityName, instance)
                  }}
                >
                  View
                </button>
                <button
                  onClick={() => {
                    void onFileButtonClick(entityName, instance)
                  }}
                >
                  {fileButtonLabel}
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
