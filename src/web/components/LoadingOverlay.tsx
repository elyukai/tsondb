import { loading } from "../signals/loading.ts"

export const LoadingOverlay = () => (
  <div
    class={"loading-overlay" + (loading.value ? " loading-overlay--open" : "")}
    aria-hidden={!loading.value}
  >
    Loading…
  </div>
)
