import type { FunctionComponent } from "preact"
import { render } from "preact"
import { LocationProvider, Route, Router } from "preact-iso"
import { CreateInstance } from "./routes/CreateInstance.tsx"
import { Entity } from "./routes/Entity.tsx"
import { Home } from "./routes/Home.tsx"
import { Instance } from "./routes/Instance.tsx"
import { NotFound } from "./routes/NotFound.tsx"

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
