import { createContext } from "preact"
import type { SerializedEntityDecl } from "../../node/schema/index.ts"

export const EntitiesContext = createContext<
  {
    declaration: SerializedEntityDecl
    instanceCount: number
    isLocaleEntity: boolean
  }[]
>([])
