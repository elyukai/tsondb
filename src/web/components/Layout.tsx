import type { ComponentChildren, FunctionComponent } from "preact"
import { Settings } from "./Settings.tsx"

type Props = {
  breadcrumbs: { url: string; label: string }[]
  children: ComponentChildren
}

export const Layout: FunctionComponent<Props> = ({ breadcrumbs, children }) => {
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
        <Settings />
      </header>
      <main>{children}</main>
    </>
  )
}
