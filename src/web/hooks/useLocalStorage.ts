import { useEffect, useState, type Dispatch, type StateUpdater } from "preact/hooks"

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  cast: (value: unknown, initialValue: T) => T = v => v as T,
): [currentValue: T, setValue: Dispatch<StateUpdater<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = localStorage.getItem(key)

    if (item) {
      try {
        return cast(JSON.parse(item), initialValue)
      } catch {
        return initialValue
      }
    }

    return initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(storedValue))
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
