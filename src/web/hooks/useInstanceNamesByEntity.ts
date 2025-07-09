import { useCallback, useEffect, useState } from "preact/hooks"
import type { GetAllInstancesResponseBody } from "../../shared/api.js"
import { getAllInstances } from "../api.js"

export type InstanceNamesByEntity = GetAllInstancesResponseBody["instances"]

export const useInstanceNamesByEntity = (
  locales: string[] = [],
): [InstanceNamesByEntity, () => void] => {
  const [instanceNamesByEntity, setInstanceNamesByEntity] = useState<
    GetAllInstancesResponseBody["instances"]
  >({})

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
  }, [locales])

  useEffect(() => {
    updateInstanceNamesByEntity()
  }, [updateInstanceNamesByEntity])

  return [instanceNamesByEntity, updateInstanceNamesByEntity]
}
