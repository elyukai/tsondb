import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { EOL } from "node:os"

export type Type = TypeLiteral | TypeIdentifier | Optional

export const renderType = (type: Type): string => {
  switch (type.tag) {
    case "TypeLiteral":
      return renderTypeLiteral(type)
    case "TypeIdentifier":
      return renderTypeIdentifier(type)
    case "Optional":
      return renderOptional(type)
    default:
      return assertExhaustive(type)
  }
}

export type Optional = {
  tag: "Optional"
  type: Type
}

export const optional = (type: Type): Optional => ({
  tag: "Optional",
  type,
})

export const optionalCond = (type: Type, flag: boolean): Type => (flag ? optional(type) : type)

const renderOptional = (config: Optional): string => `${renderType(config.type)}?`

export type TypeIdentifier = {
  tag: "TypeIdentifier"
  name: string
  srguments: Type[]
}

export const typeIdentifier = (typeName: string, typeArguments: Type[] = []): TypeIdentifier => ({
  tag: "TypeIdentifier",
  name: typeName,
  srguments: typeArguments,
})

const renderTypeIdentifier = (config: TypeIdentifier): string =>
  config.name +
  (config.srguments.length === 0
    ? ""
    : `<${config.srguments.map(arg => renderType(arg)).join(", ")}>`)

export type TypeLiteral = {
  tag: "TypeLiteral"
  name: string
}

export const typeLiteral = (typeName: string): TypeLiteral => ({
  tag: "TypeLiteral",
  name: typeName,
})

const renderTypeLiteral = (config: TypeLiteral): string => config.name

export type Declaration = Struct | Protocol | Member | TypeAlias | Enum | Extension | Func | Import

const renderDeclaration = (decl: Declaration): string => {
  switch (decl.tag) {
    case "Struct":
      return renderStruct(decl)
    case "Protocol":
      return renderProtocol(decl)
    case "Member":
      return renderMember(decl)
    case "TypeAlias":
      return renderTypeAlias(decl)
    case "Enum":
      return renderEnum(decl)
    case "Extension":
      return renderExtension(decl)
    case "Func":
      return renderFunc(decl)
    case "Import":
      return renderImport(decl)
    default:
      return assertExhaustive(decl)
  }
}

const prefixLines = (
  prefix: string,
  text: string,
  options: { includeEmptyLines?: boolean } = {},
): string => {
  const { includeEmptyLines = false } = options
  return text
    .split(EOL)
    .map(line => (line.length > 0 ? prefix + line : includeEmptyLines ? prefix.trimEnd() : line))
    .join(EOL)
}

const indent = (text: string): string => prefixLines("    ", text)

const renderComment = (comment: string | undefined) =>
  comment === undefined ? "" : prefixLines("/// ", comment, { includeEmptyLines: true }) + EOL

export type Visibility = "public" | "internal" | "private"

const renderVisibility = (config: Visibility | undefined): string => {
  switch (config) {
    case "public":
      return "public "
    case "private":
      return "private "
    case "internal":
    case undefined:
      return ""
    default:
      return assertExhaustive(config)
  }
}

const renderDeprecated = (isDeprecated: boolean | undefined): string =>
  isDeprecated === true ? `@available(*, deprecated)${EOL}` : ""

const renderDeclPrefix = (config: {
  isDeprecated?: boolean
  comment?: string
  visibility?: Visibility
}): string =>
  renderComment(config.comment) +
  renderDeprecated(config.isDeprecated) +
  renderVisibility(config.visibility)

const renderConstraints = (constraints: Type[] | undefined): string =>
  constraints === undefined || constraints.length === 0
    ? ""
    : `: ${constraints.map(renderType).join(", ")}`

const renderTypeUnions = (constraints: Type[] | undefined): string =>
  constraints === undefined || constraints.length === 0
    ? ""
    : `: ${constraints.map(renderType).join(" & ")}`

export type TypeParameter = {
  name: string
  constraints?: Type[]
}

export const typeParameter = (name: string, constraints?: Type[]): TypeParameter => ({
  name,
  constraints,
})

const renderTypeParameter = (param: TypeParameter): string =>
  param.name + (param.constraints === undefined ? "" : renderTypeUnions(param.constraints))

const renderTypeParameters = (params: TypeParameter[] | undefined): string =>
  params === undefined || params.length === 0
    ? ""
    : `<${params.map(renderTypeParameter).join(", ")}>`

const renderWhereConstraints = (
  constraints: { name: string; constraints: TypeIdentifier[] }[] | undefined,
): string =>
  constraints === undefined || constraints.length === 0
    ? ""
    : ` where ${constraints.map(c => `${c.name}${renderTypeUnions(c.constraints)}`).join(", ")}`

export type Import = {
  tag: "Import"
  module: string
}

export const importModule = (module: string): Import => ({
  tag: "Import",
  module,
})

const renderImport = (config: Import): string => `import ${config.module}`

export type TypeAlias = {
  tag: "TypeAlias"
  visibility?: Visibility
  name: string
  comment?: string
  isDeprecated?: boolean
  type: Type
  parameters?: TypeParameter[]
}

export const typealias = (options: Omit<TypeAlias, "tag">): TypeAlias => ({
  ...options,
  tag: "TypeAlias",
  visibility: options.visibility ?? "internal",
})

const renderTypeAlias = (config: TypeAlias): string =>
  `${renderDeclPrefix(config)}typealias ${config.name}${renderTypeParameters(config.parameters)} = ${renderType(config.type)}`

export type Extension = {
  tag: "Extension"
  name: string
  constraints?: TypeIdentifier[]
  declarations: (Declaration | Constructor)[]
  where?: { name: string; constraints: TypeIdentifier[] }[]
}

export const extension = (options: Omit<Extension, "tag">): Extension => ({
  ...options,
  tag: "Extension",
})

const renderExtension = (config: Extension): string => {
  const { declarations, name, constraints } = config
  return `extension ${name}${renderConstraints(constraints)}${renderWhereConstraints(config.where)} {${
    declarations.length === 0
      ? ""
      : EOL +
        EOL +
        declarations
          .map(decl =>
            indent(decl.tag === "Constructor" ? renderConstructor(decl) : renderDeclaration(decl)),
          )
          .join(EOL + EOL) +
        EOL
  }}`
}

export type Struct = {
  tag: "Struct"
  visibility?: Visibility
  name: string
  parameters?: TypeParameter[]
  comment?: string
  constraints?: TypeIdentifier[]
  isDeprecated?: boolean
  declarations: (Declaration | Constructor)[]
}

export const struct = (options: Omit<Struct, "tag">): Struct => ({
  ...options,
  tag: "Struct",
})

const renderStruct = (config: Struct): string => {
  const { declarations, name, constraints } = config
  const allMembersWithoutComments = declarations.every(
    decl => decl.tag === "Member" && decl.static !== false && decl.comment === undefined,
  )
  return `${renderDeclPrefix(config)}struct ${name}${renderTypeParameters(config.parameters)}${renderConstraints(constraints)} {${allMembersWithoutComments ? EOL : EOL + EOL}${declarations
    .map(decl =>
      indent(decl.tag === "Constructor" ? renderConstructor(decl) : renderDeclaration(decl)),
    )
    .join(allMembersWithoutComments ? EOL : EOL + EOL)}${EOL}}`
}

export type ProtocolInnerDeclaration = AssociatedType | ProtocolMember

const renderProtocolInnerDeclaration = (decl: ProtocolInnerDeclaration): string => {
  switch (decl.tag) {
    case "AssociatedType":
      return renderAssociatedType(decl)
    case "ProtocolMember":
      return renderProtocolMember(decl)
    default:
      return assertExhaustive(decl)
  }
}

export type Protocol = {
  tag: "Protocol"
  visibility?: Visibility
  constraints?: TypeIdentifier[]
  isDeprecated?: boolean
  name: string
  comment?: string
  declarations: (AssociatedType | ProtocolMember)[]
}

export const protocol = (options: Omit<Protocol, "tag">): Protocol => ({
  ...options,
  tag: "Protocol",
})

const renderProtocol = (config: Protocol): string => {
  const { declarations, constraints } = config
  return `${renderDeclPrefix(config)}protocol ${config.name}${renderConstraints(constraints)} {${
    declarations.length === 0
      ? ""
      : EOL +
        EOL +
        declarations.map(decl => indent(renderProtocolInnerDeclaration(decl))).join(EOL + EOL) +
        EOL
  }}`
}

export type Member = {
  tag: "Member"
  visibility?: Visibility
  name: string
  static?: boolean
  keyword: "let" | "var"
  type?: Type
  value?: AnyCode
  comment?: string
  isDeprecated?: boolean
}

export const member = (options: Omit<Member, "tag">): Member => ({
  ...options,
  tag: "Member",
})

const renderMember = (config: Member): string => {
  const { keyword, name, type, value } = config
  return `${renderDeclPrefix(config)}${config.static ? "static " : ""}${keyword} ${name}${type === undefined ? "" : `: ${renderType(type)}`}${value !== undefined ? ` = ${renderAnyCode(value)}` : ""}`
}

export type AssociatedType = {
  tag: "AssociatedType"
  visibility?: Visibility
  constraints?: TypeIdentifier[]
  name: string
  comment?: string
  type?: Type
  isDeprecated?: boolean
}

export const associatedtype = (options: Omit<AssociatedType, "tag">): AssociatedType => ({
  ...options,
  tag: "AssociatedType",
})

const renderAssociatedType = (config: AssociatedType): string => {
  const { name, type, constraints } = config
  return `${renderDeclPrefix(config)}associatedtype ${name}${renderTypeUnions(constraints)}${type ? ` = ${renderType(type)}` : ""}`
}

export type ProtocolMember = {
  tag: "ProtocolMember"
  visibility?: Visibility
  name: string
  static?: boolean
  keyword?: "let" | "var"
  type: Type
  comment?: string
  isDeprecated?: boolean
  accessor: "get" | "set" | "getset"
}

export const pmember = (options: Omit<ProtocolMember, "tag">): ProtocolMember => ({
  ...options,
  tag: "ProtocolMember",
})

const renderProtocolMember = (config: ProtocolMember): string => {
  const { keyword, name, type, accessor } = config
  return `${renderDeclPrefix(config)}${config.static === true ? "static " : ""}${keyword} ${name}: ${renderType(type)} { ${accessor === "get" ? "get" : accessor === "set" ? "set" : "get set"} }`
}

export type AnyCode = {
  tag: "AnyCode"
  code: (string | AnyCode)[]
}

export const raw = (...loc: (string | AnyCode)[]): AnyCode => ({
  tag: "AnyCode",
  code: loc,
})

const renderAnyCode = (loc: AnyCode): string =>
  loc.code
    .map(nestedCode =>
      typeof nestedCode === "string" ? nestedCode : indent(renderAnyCode(nestedCode)),
    )
    .join(EOL)

export type Parameter = {
  first?: string
  second?: string
  type: Type
}

const renderParameter = (param: Parameter): string => {
  const { first, second, type } = param
  if (first && second) {
    return `${first} ${second}: ${renderType(type)}`
  } else if (first) {
    return `${first}: ${renderType(type)}`
  } else if (second) {
    return `_ ${second}: ${renderType(type)}`
  } else {
    return `_: ${renderType(type)}`
  }
}

export type Constructor = {
  tag: "Constructor"
  visibility?: Visibility
  comment?: string
  isDeprecated?: boolean
  parameters?: Parameter[]
  body: AnyCode
  throws?: boolean
}

export const constructor = (options: Omit<Constructor, "tag">): Constructor => ({
  ...options,
  tag: "Constructor",
})

const renderConstructor = (config: Constructor): string => {
  const { body } = config
  return `${renderDeclPrefix(config)}init(${config.parameters?.map(renderParameter).join(", ") ?? ""})${config.throws ? " throws" : ""} {${EOL}${indent(renderAnyCode(body))}${EOL}}`
}

export type Func = {
  tag: "Func"
  visibility?: Visibility
  comment?: string
  isDeprecated?: boolean
  static?: boolean
  name: string
  typeParameters?: TypeParameter[]
  parameters?: Parameter[]
  returnType?: Type
  body: AnyCode
  throws?: boolean
}

export const func = (options: Omit<Func, "tag">): Func => ({
  ...options,
  tag: "Func",
})

const renderFunc = (config: Func): string => {
  const { name, parameters, returnType, body } = config
  return `${renderDeclPrefix(config)}${config.static === true ? "static " : ""}func ${name}${renderTypeParameters(config.typeParameters)}(${parameters?.map(renderParameter).join(", ") ?? ""})${config.throws ? " throws" : ""}${returnType ? ` -> ${renderType(returnType)}` : ""} {${EOL}${indent(renderAnyCode(body))}${EOL}}`
}

export type Enum = {
  tag: "Enum"
  visibility?: Visibility
  name: string
  comment?: string
  parameters?: TypeParameter[]
  constraints?: TypeIdentifier[]
  isDeprecated?: boolean
  declarations: (Declaration | EnumCase | Constructor)[]
}

export const enumeration = (options: Omit<Enum, "tag">): Enum => ({
  ...options,
  tag: "Enum",
})

export type EnumCase = {
  tag: "EnumCase"
  name: string
  comment?: string
  isIndirect?: boolean
  isDeprecated?: boolean
  associatedType?: Type
  rawValue?: string | number
}

export const enumCase = (options: Omit<EnumCase, "tag">): EnumCase => ({
  ...options,
  tag: "EnumCase",
})

const renderEnumCase = (config: EnumCase): string =>
  `${renderDeclPrefix(config)}${config.isIndirect === true ? "indirect " : ""}case ${config.name}${config.associatedType === undefined ? "" : `(${renderType(config.associatedType)})`}${config.rawValue !== undefined ? ` = ${JSON.stringify(config.rawValue)}` : ""}`

const renderEnum = (config: Enum): string => {
  const { name, declarations } = config
  const allEnumCasesWithoutComments = declarations.every(
    decl => decl.tag === "EnumCase" && decl.comment === undefined,
  )
  return `${renderDeclPrefix(config)}enum ${name}${renderTypeParameters(config.parameters)}${renderConstraints(config.constraints)} {${
    allEnumCasesWithoutComments ? EOL : EOL + EOL
  }${declarations
    .map(decl =>
      indent(
        decl.tag === "EnumCase"
          ? renderEnumCase(decl)
          : decl.tag === "Constructor"
            ? renderConstructor(decl)
            : renderDeclaration(decl),
      ),
    )
    .join(allEnumCasesWithoutComments ? EOL : EOL + EOL)}${EOL}}`
}

export type File = Declaration[]

export const renderFile = (file: File): string =>
  file
    .map(
      (decl, index) =>
        (index === 0
          ? ""
          : decl.tag === "Import" && file[index - 1]?.tag === "Import"
            ? EOL
            : EOL + EOL) + renderDeclaration(decl),
    )
    .join("") + EOL
