import { createContext } from "preact"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"

export const EntitiesContext = createContext<
  {
    declaration: SerializedEntityDecl
    instanceCount: number
    isLocaleEntity: boolean
  }[]
>([])
