import { useCallback, useEffect, useState } from "preact/hooks"

export const useMappedAPIResource = <T, A extends any[], U>(
  apiFn: (...args: A) => Promise<T>,
  mapFn: (data: T) => U,
  ...args: A
): [U | undefined, () => Promise<void>] => {
  const [data, setData] = useState<U>()

  const fetchData = () =>
    apiFn(...args)
      .then(result => {
        setData(mapFn(result))
      })
      .catch(err => {
        console.log(err)
      })

  useEffect(() => {
    fetchData()
  }, [])

  const reload = useCallback(() => {
    setData(undefined)
    return fetchData()
  }, [apiFn, ...args])

  return [data, reload]
}
