import type { ComponentChildren, FunctionComponent } from "preact"
import { Git } from "./Git.js"

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
      </header>
      <Git />
      <main>{children}</main>
    </>
  )
}
