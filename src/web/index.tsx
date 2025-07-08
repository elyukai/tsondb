import { FunctionComponent, render } from "preact"
import { LocationProvider, Route, Router } from "preact-iso"
import { CreateInstance } from "./routes/CreateInstance.js"
import { Entity } from "./routes/Entity.js"
import { Home } from "./routes/Home.js"
import { Instance } from "./routes/Instance.js"
import { NotFound } from "./routes/NotFound.js"

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
