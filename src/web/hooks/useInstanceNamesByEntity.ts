import { useEffect, useState } from "preact/hooks"
import { GetAllInstancesResponseBody } from "../../shared/api.js"
import { getAllInstances } from "../api.js"

export type InstanceNamesByEntity = GetAllInstancesResponseBody["instances"]

export const useInstanceNamesByEntity = (
  locales: string[] = [],
): [InstanceNamesByEntity, () => void] => {
  const [instanceNamesByEntity, setInstanceNamesByEntity] = useState<
    GetAllInstancesResponseBody["instances"]
  >({})

  const updateInstanceNamesByEntity = () => {
    getAllInstances(locales)
      .then(data => {
        setInstanceNamesByEntity(data.instances)
      })
      .catch(error => {
        console.error("Error fetching data:", error)
      })
  }

  useEffect(() => {
    updateInstanceNamesByEntity()
  }, [])

  return [instanceNamesByEntity, updateInstanceNamesByEntity]
}
