import type { Leaves } from "../../../shared/utils/object.ts"
import type { NodeKind } from "../Node.ts"
import type { SerializedObjectType } from "../types/ObjectType.ts"
import type { SerializedAsType } from "../types/Type.ts"
import type { SerializedBaseDecl } from "./Declaration.ts"

export type SerializedEntityDisplayName<T extends SerializedObjectType> =
  | Leaves<SerializedAsType<T>>
  | {
      /**
       * @default "translations"
       */
      pathToLocaleMap?: Leaves<SerializedAsType<T>>
      /**
       * @default "name"
       */
      pathInLocaleMap?: string
    }
  | null

export interface SerializedEntityDecl<
  Name extends string = string,
  T extends SerializedObjectType = SerializedObjectType,
> extends SerializedBaseDecl<Name, []> {
  kind: NodeKind["EntityDecl"]
  namePlural: string
  type: T
  /**
   * @default "name"
   */
  displayName?: SerializedEntityDisplayName<T>
  isDeprecated?: boolean
}
