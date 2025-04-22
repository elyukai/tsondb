import { useCallback, useEffect, useState } from "preact/hooks"
import { SerializedSecondaryDecl } from "../../schema/declarations/Declaration.js"
import { SerializedEnumDecl } from "../../schema/declarations/EnumDecl.js"
import { SerializedTypeAliasDecl } from "../../schema/declarations/TypeAliasDecl.js"
import { getAllDeclarations } from "../api.js"

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
      .catch(error => {
        console.error("Error fetching data:", error)
      })
  }, [])

  const getDeclFromDeclName = useCallback(
    (name: string) => secondaryDeclarations.find(decl => decl.name === name),
    [secondaryDeclarations],
  )

  return getDeclFromDeclName
}
