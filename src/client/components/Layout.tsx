import { ComponentChildren, FunctionComponent } from "preact"

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
              <li>
                <a href={url}>{label}</a>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <main>{children}</main>
    </>
  )
}
