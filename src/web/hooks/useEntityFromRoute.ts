import { useRoute } from "preact-iso"
import { useContext, useMemo } from "preact/hooks"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import type { SerializedSingletonEntityDecl } from "../../shared/schema/declarations/SingletonEntityDecl.ts"
import { EntitiesContext, SingletonEntitiesContext } from "../context/entities.ts"

export const useEntityFromRoute = ():
  | { declaration: SerializedEntityDecl; isLocaleEntity: boolean }
  | undefined => {
  const {
    params: { name },
  } = useRoute()

  const { entities } = useContext(EntitiesContext)
  const entityObj = useMemo(
    () =>
      entities.find(
        e => e.declaration.name === name && e.declaration.parentReferenceKey === undefined,
      ),
    [entities, name],
  )

  return entityObj
}

export const useSingletonEntityFromRoute = ():
  | { declaration: SerializedSingletonEntityDecl }
  | undefined => {
  const {
    params: { name },
  } = useRoute()

  const { singletonEntities } = useContext(SingletonEntitiesContext)
  const entityObj = useMemo(
    () => singletonEntities.find(e => e.declaration.name === name),
    [singletonEntities, name],
  )

  return entityObj
}
