import { useCallback, useContext, useEffect, useState } from "preact/hooks"
import type { SerializedSecondaryDecl } from "../../shared/schema/declarations/Declaration.ts"
import type { SerializedEnumDecl } from "../../shared/schema/declarations/EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "../../shared/schema/declarations/TypeAliasDecl.ts"
import { getAllDeclarations } from "../api/declarations.ts"
import { LocalesContext } from "../context/locales.ts"

export type GetDeclFromDeclName = (name: string) => SerializedSecondaryDecl | undefined

export const useGetDeclFromDeclName = (): [GetDeclFromDeclName, loaded: boolean] => {
  const { locales } = useContext(LocalesContext)
  const [secondaryDeclarations, setSecondaryDeclarations] = useState<SerializedSecondaryDecl[]>()

  useEffect(() => {
    getAllDeclarations(locales)
      .then(data => {
        setSecondaryDeclarations(
          data.declarations
            .map(decl => decl.declaration)
            .filter(
              (decl): decl is SerializedEnumDecl | SerializedTypeAliasDecl =>
                decl.kind === "EnumDecl" || decl.kind === "TypeAliasDecl",
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
