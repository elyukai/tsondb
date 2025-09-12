import type { FunctionalComponent } from "preact"
import { useEffect } from "preact/hooks"
import { Layout } from "../components/Layout.tsx"

export const NotFound: FunctionalComponent = () => {
  useEffect(() => {
    document.title = "Not found — TSONDB"
  }, [])

  return (
    <Layout breadcrumbs={[{ url: "/", label: "Home" }]}>
      <h1>404 Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </Layout>
  )
}
