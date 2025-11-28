import type { ComponentChildren, FunctionComponent } from "preact"
import { useContext } from "preact/hooks"
import { GitContext } from "../context/git.ts"
import { useSetting } from "../hooks/useSettings.ts"
import { Settings } from "./Settings.tsx"

type Props = {
  breadcrumbs: { url: string; label: string }[]
  children: ComponentChildren
}

export const Layout: FunctionComponent<Props> = ({ breadcrumbs, children }) => {
  const [_1, setIsGitOpen] = useContext(GitContext)
  const [isGitAlwaysOpen, _2] = useSetting("gitSidebar")
  return (
    <>
      <header>
        <nav>
          <ol>
            {breadcrumbs.map(({ url, label }) => (
              <li key={url}>
                <a href={url}>{label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div class="nav-buttons">
          <a href="/search" class="btn">
            Search
          </a>
          <button
            class={`git-toggle${!isGitAlwaysOpen ? " git-toggle--no-sidebar" : ""}`}
            onClick={() => {
              setIsGitOpen(b => !b)
            }}
          >
            File changes
          </button>
          <Settings />
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
