import { createContext } from "preact"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"

export type EntitySummary = {
  declaration: SerializedEntityDecl
  instanceCount: number
  isLocaleEntity: boolean
}

export const EntitiesContext = createContext<{
  entities: EntitySummary[]
  reloadEntities: () => Promise<void>
}>({ entities: [], reloadEntities: async () => {} })
