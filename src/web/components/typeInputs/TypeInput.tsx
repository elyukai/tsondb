import type { FunctionComponent } from "preact"
import { memo } from "preact/compat"
import type { SerializedType } from "../../../node/schema/types/Type.ts"
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

type Props = {
  type: SerializedType
  path: string | undefined
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown) => void
}

const TypeInput: FunctionComponent<Props> = ({
  type,
  path,
  value,
  instanceNamesByEntity,
  getDeclFromDeclName,
  onChange,
}) => {
  // console.log("rendering node at path ", path ?? "<root>")

  switch (type.kind) {
    case "BooleanType":
      return <BooleanTypeInput type={type} value={value} onChange={onChange} />

    case "DateType":
      return <DateTypeInput type={type} value={value} onChange={onChange} />

    case "FloatType":
      return <FloatTypeInput type={type} value={value} onChange={onChange} />

    case "IntegerType":
      return <IntegerTypeInput type={type} value={value} onChange={onChange} />

    case "StringType":
      return <StringTypeInput type={type} value={value} onChange={onChange} />

    case "ArrayType":
      return (
        <ArrayTypeInput
          type={type}
          path={path}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    case "ObjectType":
      return (
        <ObjectTypeInput
          type={type}
          path={path}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    case "TypeArgumentType":
      return <TypeArgumentTypeInput type={type} />

    case "ReferenceIdentifierType":
      return (
        <ReferenceIdentifierTypeInput
          type={type}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          onChange={onChange}
        />
      )

    case "IncludeIdentifierType":
      return (
        <IncludeIdentifierTypeInput
          type={type}
          path={path}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    case "NestedEntityMapType":
      return (
        <NestedEntityMapTypeInput
          type={type}
          path={path}
          value={value as Record<string, unknown>}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    case "EnumType":
      return (
        <EnumTypeInput
          type={type}
          path={path}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    case "ChildEntitiesType":
      return (
        <ChildEntitiesTypeInput
          type={type}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    default:
      return assertExhaustive(type)
  }
}

const MemoizedTypeInput = memo(
  TypeInput,
  (prevProps, nextProps) =>
    prevProps.value === nextProps.value && prevProps.onChange === nextProps.onChange,
)

export { MemoizedTypeInput as TypeInput }
