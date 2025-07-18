import type { FunctionComponent } from "preact"
import { render } from "preact"
import { LocationProvider, Route, Router } from "preact-iso"
import { CreateInstance } from "./routes/CreateInstance.ts"
import { Entity } from "./routes/Entity.ts"
import { Home } from "./routes/Home.ts"
import { Instance } from "./routes/Instance.ts"
import { NotFound } from "./routes/NotFound.ts"

const App: FunctionComponent = () => (
  <LocationProvider>
    <Router>
      <Route path="/" component={Home} />
      <Route path="/entities/:name" component={Entity} />
      <Route path="/entities/:name/instances/create" component={CreateInstance} />
      <Route path="/entities/:name/instances/:id" component={Instance} />
      <Route default component={NotFound} />
    </Router>
  </LocationProvider>
)

const root = document.getElementById("app") as HTMLElement

render(<App />, root)
