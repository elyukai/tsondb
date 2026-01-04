import { useCallback, useState } from "preact/hooks"

export const useBoolean = (
  initialValue: boolean | (() => boolean) = false,
): [boolean, (newValue?: boolean) => void] => {
  const [value, setValue] = useState(initialValue)
  const toggleValue = useCallback((newValue?: boolean) => {
    if (typeof newValue === "boolean") {
      setValue(newValue)
    } else {
      setValue(old => !old)
    }
  }, [])
  return [value, toggleValue]
}
