import { useCallback, useEffect, useState } from "preact/hooks"
import { logAndAlertError } from "../utils/debug.ts"

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFn, mapFn, ...args],
  )

  useEffect(() => {
    fetchData().catch(logAndAlertError)
  }, [fetchData])

  const reload = useCallback(fetchData, [fetchData])

  return [data, reload]
}
