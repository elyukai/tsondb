import { createContext } from "preact"
import type { GitClient } from "../hooks/useGitClient.ts"

export const GitClientContext = createContext<GitClient | undefined>(undefined)
