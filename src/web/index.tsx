import type { FunctionComponent } from "preact"
import { render } from "preact"
import { LocationProvider, Route, Router, useLocation } from "preact-iso"
import { useEffect } from "preact/hooks"
import type { GetAllDeclarationsResponseBody } from "../shared/api.ts"
import type { SerializedEntityDecl } from "../shared/schema/declarations/EntityDecl.ts"
import { getAllEntities } from "./api/declarations.ts"
import { getWebConfig } from "./api/index.ts"
import { Git } from "./components/Git.tsx"
import { ConfigContext, type WebConfig } from "./context/config.ts"
import { EntitiesContext } from "./context/entities.ts"
import { SettingsContext } from "./context/settings.ts"
import { useMappedAPIResource } from "./hooks/useMappedAPIResource.ts"
import { useSettings } from "./hooks/useSettings.ts"
import { CreateInstance } from "./routes/CreateInstance.tsx"
import { Entity } from "./routes/Entity.tsx"
import { Home } from "./routes/Home.tsx"
import { Instance } from "./routes/Instance.tsx"
import { NotFound } from "./routes/NotFound.tsx"

const mapEntities = (data: GetAllDeclarationsResponseBody<SerializedEntityDecl>) =>
  data.declarations
    .map(decl => ({ ...decl, isLocaleEntity: decl.declaration.name === data.localeEntity }))
    .sort((a, b) => a.declaration.name.localeCompare(b.declaration.name))

type Props = {
  config: WebConfig
}

const App: FunctionComponent<Props> = ({ config }) => {
  const settingsContext = useSettings()

  const [entities, reloadEntities] = useMappedAPIResource(
    getAllEntities,
    mapEntities,
    settingsContext.settings.displayedLocales,
  )

  const location = useLocation()

  useEffect(() => {
    reloadEntities().catch((error: unknown) => {
      alert("Error reloading entities: " + String(error))
    })
  }, [location.path, reloadEntities])

  return (
    <ConfigContext.Provider value={config}>
      <SettingsContext.Provider value={settingsContext}>
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
      </SettingsContext.Provider>
    </ConfigContext.Provider>
  )
}

const config = await getWebConfig()

const root = document.getElementById("app") as HTMLElement

render(<App config={config} />, root)
