import type { ComponentChildren, FunctionComponent } from "preact"
import { useContext } from "preact/hooks"
import { GitContext } from "../context/git.ts"
import { Settings } from "./Settings.tsx"

type Props = {
  breadcrumbs: { url: string; label: string }[]
  children: ComponentChildren
}

export const Layout: FunctionComponent<Props> = ({ breadcrumbs, children }) => {
  const [_, setIsGitOpen] = useContext(GitContext)
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
          <button
            class="git-toggle"
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
