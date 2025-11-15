import type { FunctionComponent } from "preact"
import { memo } from "preact/compat"
import type { UnsafeEntityTaggedInstanceContainerWithChildInstances } from "../../../node/utils/childInstances.ts"
import type { SerializedType } from "../../../shared/schema/types/Type.ts"
import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { ArrayTypeInput } from "./ArrayTypeInput.tsx"
import { BooleanTypeInput } from "./BooleanTypeInput.tsx"
import { ChildEntitiesTypeInput } from "./ChildEntitiesTypeInput.tsx"
import { DateTypeInput } from "./DateTypeInput.tsx"
import { EnumTypeInput } from "./EnumTypeInput.tsx"
import { FloatTypeInput } from "./FloatTypeInput.tsx"
import { TypeArgumentTypeInput } from "./GenericTypeArgumentIdentifierTypeInput.tsx"
import { IncludeIdentifierTypeInput } from "./IncludeIdentifierTypeInput.tsx"
import { IntegerTypeInput } from "./IntegerTypeInput.tsx"
import { NestedEntityMapTypeInput } from "./NestedEntityMapTypeInput.tsx"
import { ObjectTypeInput } from "./ObjectTypeInput.tsx"
import { ReferenceIdentifierTypeInput } from "./ReferenceIdentifierTypeInput.tsx"
import { StringTypeInput } from "./StringTypeInput.tsx"
import { TranslationObjectTypeInput } from "./TranslationObjectTypeInput.tsx"

export type TypeInputProps<T, V = unknown> = {
  type: T
  path: string | undefined
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  parentKey?: string
  childInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[]
  disabled?: boolean
  inTranslationObject?: boolean
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: V) => void
  setChildInstances: (
    newInstances: (
      oldInstances: UnsafeEntityTaggedInstanceContainerWithChildInstances[],
    ) => UnsafeEntityTaggedInstanceContainerWithChildInstances[],
  ) => void
  checkIsLocaleEntity: (entityName: string) => boolean
}

type Props = TypeInputProps<SerializedType>

const TypeInput: FunctionComponent<Props> = props => {
  // console.log("rendering node at path ", props.path ?? "<root>")

  switch (props.type.kind) {
    case "BooleanType":
      return <BooleanTypeInput {...props} type={props.type} />

    case "DateType":
      return <DateTypeInput {...props} type={props.type} />

    case "FloatType":
      return <FloatTypeInput {...props} type={props.type} />

    case "IntegerType":
      return <IntegerTypeInput {...props} type={props.type} />

    case "StringType":
      return <StringTypeInput {...props} type={props.type} />

    case "ArrayType":
      return <ArrayTypeInput {...props} type={props.type} />

    case "ObjectType":
      return <ObjectTypeInput {...props} type={props.type} />

    case "TypeArgumentType":
      return <TypeArgumentTypeInput {...props} type={props.type} />

    case "ReferenceIdentifierType":
      return <ReferenceIdentifierTypeInput {...props} type={props.type} />

    case "IncludeIdentifierType":
      return <IncludeIdentifierTypeInput {...props} type={props.type} />

    case "NestedEntityMapType":
      return <NestedEntityMapTypeInput {...props} type={props.type} />

    case "EnumType":
      return <EnumTypeInput {...props} type={props.type} />

    case "ChildEntitiesType":
      return <ChildEntitiesTypeInput {...props} type={props.type} />

    case "TranslationObjectType":
      return <TranslationObjectTypeInput {...props} type={props.type} />

    default:
      return assertExhaustive(props.type)
  }
}

const MemoizedTypeInput = memo(
  TypeInput,
  (prevProps, nextProps) =>
    prevProps.value === nextProps.value &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.childInstances === nextProps.childInstances,
)

export { MemoizedTypeInput as TypeInput }
