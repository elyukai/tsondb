import { useCallback, useEffect, useState } from "preact/hooks"

export const useMappedAPIResource = <T, A extends unknown[], U>(
  apiFn: (...args: A) => Promise<T>,
  mapFn: (data: T) => U,
  ...args: A
): [U | undefined, () => Promise<void>] => {
  const [data, setData] = useState<U>()

  const fetchData = useCallback(
    () =>
      apiFn(...args).then(result => {
        setData(mapFn(result))
      }),
    [apiFn, args, mapFn],
  )

  useEffect(() => {
    fetchData().catch((err: unknown) => {
      console.log(err)
    })
  }, [fetchData])

  const reload = useCallback(() => {
    setData(undefined)
    return fetchData()
  }, [fetchData])

  return [data, reload]
}
