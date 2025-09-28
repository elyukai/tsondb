import { useCallback, useContext, useEffect, useState } from "preact/hooks"
import type { GetAllInstancesResponseBody } from "../../shared/api.ts"
import { getAllInstances } from "../api/instances.ts"
import { LocalesContext } from "../context/locales.ts"

export type InstanceNamesByEntity = GetAllInstancesResponseBody["instances"]

export const useInstanceNamesByEntity = (): [InstanceNamesByEntity | undefined, () => void] => {
  const { locales } = useContext(LocalesContext)
  const [instanceNamesByEntity, setInstanceNamesByEntity] =
    useState<GetAllInstancesResponseBody["instances"]>()

  const updateInstanceNamesByEntity = useCallback(() => {
    getAllInstances(locales)
      .then(data => {
        setInstanceNamesByEntity(data.instances)
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error fetching data:", error.toString())
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locales.toString()])

  useEffect(() => {
    updateInstanceNamesByEntity()
  }, [updateInstanceNamesByEntity])

  return [instanceNamesByEntity, updateInstanceNamesByEntity]
}
