import type { FunctionComponent } from "preact"
import type { SerializedType } from "../../../node/schema/types/Type.ts"
import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import type { InstanceNamesByEntity } from "../../hooks/useInstanceNamesByEntity.ts"
import type { GetDeclFromDeclName } from "../../hooks/useSecondaryDeclarations.ts"
import { ArrayTypeInput } from "./ArrayTypeInput.ts"
import { BooleanTypeInput } from "./BooleanTypeInput.ts"
import { DateTypeInput } from "./DateTypeInput.ts"
import { EnumTypeInput } from "./EnumTypeInput.ts"
import { FloatTypeInput } from "./FloatTypeInput.ts"
import { TypeArgumentTypeInput } from "./GenericTypeArgumentIdentifierTypeInput.ts"
import { IncludeIdentifierTypeInput } from "./IncludeIdentifierTypeInput.ts"
import { IntegerTypeInput } from "./IntegerTypeInput.ts"
import { NestedEntityMapTypeInput } from "./NestedEntityMapTypeInput.ts"
import { ObjectTypeInput } from "./ObjectTypeInput.ts"
import { ReferenceIdentifierTypeInput } from "./ReferenceIdentifierTypeInput.ts"
import { StringTypeInput } from "./StringTypeInput.ts"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.ts"

type Props = {
  type: SerializedType
  value: unknown
  instanceNamesByEntity: InstanceNamesByEntity
  getDeclFromDeclName: GetDeclFromDeclName
  onChange: (value: unknown) => void
}

export const TypeInput: FunctionComponent<Props> = ({
  type,
  value,
  instanceNamesByEntity,
  getDeclFromDeclName,
  onChange,
}) => {
  switch (type.kind) {
    case "BooleanType":
      if (typeof value === "boolean") {
        return <BooleanTypeInput type={type} value={value} onChange={onChange} />
      } else {
        return <MismatchingTypeError expected="boolean" actual={value} />
      }

    case "DateType":
      if (typeof value === "string") {
        return <DateTypeInput type={type} value={value} onChange={onChange} />
      } else {
        return <MismatchingTypeError expected="date string" actual={value} />
      }

    case "FloatType":
      if (typeof value === "number") {
        return <FloatTypeInput type={type} value={value} onChange={onChange} />
      } else {
        return <MismatchingTypeError expected="float" actual={value} />
      }

    case "IntegerType":
      if (typeof value === "number" && Number.isInteger(value)) {
        return <IntegerTypeInput type={type} value={value} onChange={onChange} />
      } else {
        return <MismatchingTypeError expected="integer" actual={value} />
      }

    case "StringType":
      if (typeof value === "string") {
        return <StringTypeInput type={type} value={value} onChange={onChange} />
      } else {
        return <MismatchingTypeError expected="string" actual={value} />
      }

    case "ArrayType":
      if (Array.isArray(value)) {
        return (
          <ArrayTypeInput
            type={type}
            value={value}
            instanceNamesByEntity={instanceNamesByEntity}
            getDeclFromDeclName={getDeclFromDeclName}
            onChange={onChange}
          />
        )
      } else {
        return <MismatchingTypeError expected="array" actual={value} />
      }

    case "ObjectType":
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return (
          <ObjectTypeInput
            type={type}
            value={value as Record<string, unknown>}
            instanceNamesByEntity={instanceNamesByEntity}
            getDeclFromDeclName={getDeclFromDeclName}
            onChange={onChange}
          />
        )
      } else {
        return <MismatchingTypeError expected="object" actual={value} />
      }

    case "TypeArgumentType":
      return <TypeArgumentTypeInput type={type} />

    case "ReferenceIdentifierType":
      if (typeof value === "string") {
        return (
          <ReferenceIdentifierTypeInput
            type={type}
            value={value}
            instanceNamesByEntity={instanceNamesByEntity}
            onChange={onChange}
          />
        )
      } else {
        return <MismatchingTypeError expected="string identifier" actual={value} />
      }

    case "IncludeIdentifierType":
      return (
        <IncludeIdentifierTypeInput
          type={type}
          value={value}
          instanceNamesByEntity={instanceNamesByEntity}
          getDeclFromDeclName={getDeclFromDeclName}
          onChange={onChange}
        />
      )

    case "NestedEntityMapType":
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return (
          <NestedEntityMapTypeInput
            type={type}
            value={value as Record<string, unknown>}
            instanceNamesByEntity={instanceNamesByEntity}
            getDeclFromDeclName={getDeclFromDeclName}
            onChange={onChange}
          />
        )
      } else {
        return <MismatchingTypeError expected="entity map" actual={value} />
      }

    case "EnumType":
      return (
        <EnumTypeInput
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
