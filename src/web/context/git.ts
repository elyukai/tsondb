import { createContext } from "preact"
import type { SetStateAction } from "preact/compat"
import type { Dispatch } from "preact/hooks"

export type GitContext = [isOpen: boolean, setIsOpen: Dispatch<SetStateAction<boolean>>]

export const GitContext = createContext<GitContext>([false, () => {}])
