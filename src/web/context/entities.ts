import { createContext } from "preact"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"

export const EntitiesContext = createContext<{
  entities: {
    declaration: SerializedEntityDecl
    instanceCount: number
    isLocaleEntity: boolean
  }[]
  reloadEntities: () => Promise<void>
}>({ entities: [], reloadEntities: async () => {} })
