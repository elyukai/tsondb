import { useCallback, useEffect, useState } from "preact/hooks"
import type { SerializedSecondaryDecl } from "../../node/schema/declarations/Declaration.ts"
import type { SerializedEnumDecl } from "../../node/schema/declarations/EnumDecl.ts"
import type { SerializedTypeAliasDecl } from "../../node/schema/declarations/TypeAliasDecl.ts"
import { getAllDeclarations } from "../api.ts"

export type GetDeclFromDeclName = (name: string) => SerializedSecondaryDecl | undefined

export const useGetDeclFromDeclName = (): GetDeclFromDeclName => {
  const [secondaryDeclarations, setSecondaryDeclarations] = useState<SerializedSecondaryDecl[]>([])

  useEffect(() => {
    getAllDeclarations()
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
  }, [])

  const getDeclFromDeclName = useCallback(
    (name: string) => secondaryDeclarations.find(decl => decl.name === name),
    [secondaryDeclarations],
  )

  return getDeclFromDeclName
}
