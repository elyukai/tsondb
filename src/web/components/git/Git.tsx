import type { FunctionComponent } from "preact"
import { useContext, useState } from "preact/hooks"
import { GitContext } from "../../context/git.ts"
import { GitClientContext } from "../../context/gitClient.ts"
import { useSetting } from "../../hooks/useSettings.ts"
import { ModalDialog } from "../ModalDialog.tsx"
import { GitBranchManager } from "./GitBranchManager.tsx"
import { GitFileManager } from "./GitFileManager.tsx"

type GitMode = "files" | "branches"

export const Git: FunctionComponent = () => {
  const [isOpen, setIsOpen] = useContext(GitContext)
  const [mode, setMode] = useState<GitMode>("files")
  const client = useContext(GitClientContext)
  const [isGitAlwaysOpen] = useSetting("gitSidebar")

  if (!client || !client.isRepo) {
    return null
  }

  return (
    <>
      <ModalDialog
        open={isOpen}
        class="git"
        closedBy="any"
        onClose={() => {
          setIsOpen(false)
        }}
      >
        <header>
          <h2>
            {(() => {
              switch (mode) {
                case "branches":
                  return "Branches"
                case "files":
                  return "Files"
                default:
                  return null
              }
            })()}
          </h2>
          {mode === "branches" ? (
            <button
              onClick={() => {
                void client.fetch()
              }}
            >
              Fetch
            </button>
          ) : null}
          {mode !== "files" ? (
            <button
              class="git__tab git__tab--files"
              onClick={() => {
                setMode("files")
              }}
            >
              View Files
            </button>
          ) : null}
          {mode !== "branches" ? (
            <button
              class="git__tab git__tab--branches"
              onClick={() => {
                setMode("branches")
              }}
            >
              Manage Branches
            </button>
          ) : null}
          <button
            class="close"
            onClick={() => {
              setIsOpen(false)
            }}
          >
            Close
          </button>
        </header>
        {(() => {
          switch (mode) {
            case "branches":
              return <GitBranchManager client={client} />
            case "files":
              return <GitFileManager client={client} />
            default:
              return null
          }
        })()}
      </ModalDialog>
      {!isGitAlwaysOpen || (isOpen && mode === "files") ? null : (
        <aside class="git">
          <h2 class="h1-faded">Version Control</h2>
          <GitFileManager
            client={client}
            manageBranches={() => {
              setIsOpen(true)
              setMode("branches")
            }}
          />
        </aside>
      )}
    </>
  )
}
