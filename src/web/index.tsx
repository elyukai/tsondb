import type { FunctionComponent } from "preact"
import { render } from "preact"
import { LocationProvider, Route, Router, useLocation } from "preact-iso"
import { useEffect, useState } from "preact/hooks"
import type { GetAllDeclarationsResponseBody } from "../shared/api.ts"
import type { SerializedEntityDecl } from "../shared/schema/declarations/EntityDecl.ts"
import { getAllEntities } from "./api/declarations.ts"
import { getWebConfig } from "./api/index.ts"
import { ContextProviderWrapper } from "./components/ContextProviderWrapper.tsx"
import { Git } from "./components/git/Git.tsx"
import { LoadingOverlay } from "./components/LoadingOverlay.tsx"
import { ConfigContext, type WebConfig } from "./context/config.ts"
import { EntitiesContext } from "./context/entities.ts"
import { GitContext } from "./context/git.ts"
import { GitClientContext } from "./context/gitClient.ts"
import { SettingsContext } from "./context/settings.ts"
import { useGitClient } from "./hooks/useGitClient.ts"
import { useMappedAPIResource } from "./hooks/useMappedAPIResource.ts"
import { useSettings } from "./hooks/useSettings.ts"
import { CreateInstance } from "./routes/CreateInstance.tsx"
import { Entity } from "./routes/Entity.tsx"
import { Home } from "./routes/Home.tsx"
import { Instance } from "./routes/Instance.tsx"
import { NotFound } from "./routes/NotFound.tsx"
import { Search } from "./routes/Search.tsx"

const mapEntities = (data: GetAllDeclarationsResponseBody<SerializedEntityDecl>) =>
  data.declarations
    .map(decl => ({ ...decl, isLocaleEntity: decl.declaration.name === data.localeEntity }))
    .sort((a, b) => a.declaration.name.localeCompare(b.declaration.name))

type Props = {
  config: WebConfig
}

const App: FunctionComponent<Props> = ({ config }) => {
  const settingsContext = useSettings(config)
  const [isGitOpen, setIsGitOpen] = useState(false)

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
        <GitContext.Provider value={[isGitOpen, setIsGitOpen]}>
          <LocationProvider>
            <EntitiesContext.Provider value={{ entities: entities ?? [], reloadEntities }}>
              <ContextProviderWrapper context={GitClientContext} useValue={useGitClient}>
                <LoadingOverlay />
                <Router>
                  <Route path="/" component={Home} />
                  <Route path="/search" component={Search} />
                  <Route path="/entities/:name" component={Entity} />
                  <Route path="/entities/:name/instances/create" component={CreateInstance} />
                  <Route path="/entities/:name/instances/:id" component={Instance} />
                  <Route default component={NotFound} />
                </Router>
                <Git />
              </ContextProviderWrapper>
            </EntitiesContext.Provider>
          </LocationProvider>
        </GitContext.Provider>
      </SettingsContext.Provider>
    </ConfigContext.Provider>
  )
}

const config = await getWebConfig()

const root = document.getElementById("app") as HTMLElement

render(<App config={config} />, root)
