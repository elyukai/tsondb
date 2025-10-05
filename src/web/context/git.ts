import { createContext } from "preact"
import type { SetStateAction } from "preact/compat"
import type { Dispatch } from "preact/hooks"

export const GitContext = createContext<
  [isOpen: boolean, setIsOpen: Dispatch<SetStateAction<boolean>>]
>([false, () => {}])
