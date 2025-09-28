import type { FunctionComponent } from "preact"
import { render } from "preact"
import { LocationProvider, Route, Router, useLocation } from "preact-iso"
import { useEffect } from "preact/hooks"
import type { GetAllDeclarationsResponseBody } from "../shared/api.ts"
import type { SerializedEntityDecl } from "../shared/schema/declarations/EntityDecl.ts"
import { getAllEntities } from "./api.ts"
import { Git } from "./components/Git.tsx"
import { EntitiesContext } from "./context/entities.ts"
import { useMappedAPIResource } from "./hooks/useMappedAPIResource.ts"
import { CreateInstance } from "./routes/CreateInstance.tsx"
import { Entity } from "./routes/Entity.tsx"
import { Home } from "./routes/Home.tsx"
import { Instance } from "./routes/Instance.tsx"
import { NotFound } from "./routes/NotFound.tsx"

const mapEntities = (data: GetAllDeclarationsResponseBody<SerializedEntityDecl>) =>
  data.declarations
    .map(decl => ({ ...decl, isLocaleEntity: decl.declaration.name === data.localeEntity }))
    .sort((a, b) => a.declaration.name.localeCompare(b.declaration.name))

const App: FunctionComponent = () => {
  const [entities, reloadEntities] = useMappedAPIResource(getAllEntities, mapEntities)

  const location = useLocation()

  useEffect(() => {
    reloadEntities().catch((error: unknown) => {
      alert("Error reloading entities: " + String(error))
    })
  }, [location.path, reloadEntities])

  return (
    <LocationProvider>
      <EntitiesContext.Provider value={{ entities: entities ?? [], reloadEntities }}>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/entities/:name" component={Entity} />
          <Route path="/entities/:name/instances/create" component={CreateInstance} />
          <Route path="/entities/:name/instances/:id" component={Instance} />
          <Route default component={NotFound} />
        </Router>
        <Git />
      </EntitiesContext.Provider>
    </LocationProvider>
  )
}

const root = document.getElementById("app") as HTMLElement

render(<App />, root)
