import { useRoute } from "preact-iso"
import { useContext, useMemo } from "preact/hooks"
import type { SerializedEntityDecl } from "../../shared/schema/declarations/EntityDecl.ts"
import { EntitiesContext } from "../context/entities.ts"

export const useEntityFromRoute = ():
  | { declaration: SerializedEntityDecl; isLocaleEntity: boolean }
  | undefined => {
  const {
    params: { name },
  } = useRoute()

  const { entities } = useContext(EntitiesContext)
  const entityObj = useMemo(() => entities.find(e => e.declaration.name === name), [entities, name])

  return entityObj
}
