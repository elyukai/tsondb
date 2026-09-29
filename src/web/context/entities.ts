import { createContext } from "preact"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedSingletonEntityDecl } from "../../shared/schema/declarations/SingletonEntityDecl.ts"
import type { NodeKind } from "../../shared/schema/Node.ts"

export type EntitySummary = {
  type: NodeKind["EntityDecl"]
  declaration: SerializedEntityDecl
  instanceCount: number
  isLocaleEntity: boolean
}

export const EntitiesContext = createContext<{
  entities: EntitySummary[]
  reloadEntities: () => Promise<void>
}>({ entities: [], reloadEntities: async () => {} })

export type SingletonEntitySummary = {
  type: NodeKind["SingletonEntityDecl"]
  declaration: SerializedSingletonEntityDecl
  hasInstance: boolean
}

export const SingletonEntitiesContext = createContext<{
  singletonEntities: SingletonEntitySummary[]
  reloadSingletonEntities: () => Promise<void>
}>({ singletonEntities: [], reloadSingletonEntities: async () => {} })
