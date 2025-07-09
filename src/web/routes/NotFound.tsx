import type { FunctionalComponent } from "preact"
import { Layout } from "../components/Layout.js"

export const NotFound: FunctionalComponent = () => {
  return (
    <Layout breadcrumbs={[{ url: "/", label: "Home" }]}>
      <h1>404 Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </Layout>
  )
}
