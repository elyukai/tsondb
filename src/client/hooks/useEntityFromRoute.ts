import { useRoute } from "preact-iso"
import { useEffect, useMemo, useState } from "preact/hooks"
import { SerializedEntityDecl } from "../../schema/declarations/EntityDecl.js"
import { getEntityByName } from "../api.js"

export const useEntityFromRoute = ():
  | { entity: SerializedEntityDecl; isLocaleEntity: boolean }
  | undefined => {
  const {
    params: { name },
  } = useRoute()

  const [entityData, setEntityData] = useState<{
    declaration: SerializedEntityDecl
    isLocaleEntity: boolean
  }>()

  useEffect(() => {
    if (name) {
      getEntityByName(name)
        .then(data => {
          setEntityData(data)
        })
        .catch(error => {
          console.error("Error fetching data:", error)
        })
    }
  }, [name])

  const entityObj = useMemo(
    () =>
      entityData && { entity: entityData.declaration, isLocaleEntity: entityData.isLocaleEntity },
    [entityData],
  )

  return entityObj
}
