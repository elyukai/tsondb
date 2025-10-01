import { useCallback, useEffect, useState } from "preact/hooks"
import type { SerializedSecondaryDecl } from "../../shared/schema/declarations/Declaration.ts"
import { getAllDeclarations } from "../api/declarations.ts"
import { useSetting } from "./useSettings.ts"

export type GetDeclFromDeclName = (name: string) => SerializedSecondaryDecl | undefined

export const useGetDeclFromDeclName = (): [GetDeclFromDeclName, loaded: boolean] => {
  const [locales] = useSetting("displayedLocales")
  const [secondaryDeclarations, setSecondaryDeclarations] = useState<SerializedSecondaryDecl[]>()

  useEffect(() => {
    getAllDeclarations(locales)
      .then(data => {
        setSecondaryDeclarations(
          data.declarations
            .map(decl => decl.declaration)
            .filter(
              (decl): decl is SerializedSecondaryDecl =>
                decl.kind === "EnumDecl" ||
                decl.kind === "TypeAliasDecl" ||
                decl.parentReferenceKey !== undefined,
            ),
        )
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error("Error fetching data:", error.toString())
        }
      })
  }, [locales])

  const getDeclFromDeclName = useCallback(
    (name: string) => secondaryDeclarations?.find(decl => decl.name === name),
    [secondaryDeclarations],
  )

  return [getDeclFromDeclName, secondaryDeclarations !== undefined]
}
