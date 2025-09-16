import * as SourceAst from "../../../ast.js"

export type AstRoot = DeclNode[]

//#region Tokens

export type Token =
  | BinaryOperatorToken
  | ExclamationMarkToken
  | IdentifierToken
  | KeywordToken
  | PostfixQuestionMarkToken

export enum TokenKind {
  BinaryOperator,
  ExclamationMark,
  Identifier,
  Keyword,
  PostfixQuestionMark,
}

export type BinaryOperatorToken = Readonly<{
  kind: TokenKind.BinaryOperator
  operator: string
}>

export type ExclamationMarkToken = Readonly<{
  kind: TokenKind.ExclamationMark
}>

export type IdentifierToken = Readonly<{
  kind: TokenKind.Identifier
  identifier: string
}>

export type KeywordToken = Readonly<{
  kind: TokenKind.Keyword
  keyword: Keyword
}>

export enum Keyword {
  Any = "Any",
  Protocol = "Protocol",
  Self = "Self",
  Sendable = "Sendable",
  Type = "Type",
  accesses = "accesses",
  actor = "actor",
  addressWithNativeOwner = "addressWithNativeOwner",
  addressWithOwner = "addressWithOwner",
  any = "any",
  as = "as",
  assignment = "assignment",
  associatedtype = "associatedtype",
  associativity = "associativity",
  async = "async",
  attached = "attached",
  autoclosure = "autoclosure",
  availability = "availability",
  available = "available",
  await = "await",
  backDeployed = "backDeployed",
  before = "before",
  block = "block",
  borrowing = "borrowing",
  break = "break",
  cType = "cType",
  canImport = "canImport",
  case = "case",
  catch = "catch",
  class = "class",
  compiler = "compiler",
  consume = "consume",
  consuming = "consuming",
  continue = "continue",
  convenience = "convenience",
  convention = "convention",
  copy = "copy",
  default = "default",
  defer = "defer",
  deinit = "deinit",
  deprecated = "deprecated",
  derivative = "derivative",
  didSet = "didSet",
  differentiable = "differentiable",
  discard = "discard",
  distributed = "distributed",
  do = "do",
  dynamic = "dynamic",
  each = "each",
  else = "else",
  enum = "enum",
  escaping = "escaping",
  exclusivity = "exclusivity",
  exported = "exported",
  extension = "extension",
  fallthrough = "fallthrough",
  false = "false",
  file = "file",
  fileprivate = "fileprivate",
  final = "final",
  for = "for",
  forward = "forward",
  freestanding = "freestanding",
  func = "func",
  get = "get",
  guard = "guard",
  higherThan = "higherThan",
  if = "if",
  import = "import",
  in = "in",
  indirect = "indirect",
  infix = "infix",
  init = "init",
  initializes = "initializes",
  inline = "inline",
  inout = "inout",
  internal = "internal",
  introduced = "introduced",
  is = "is",
  isolated = "isolated",
  kind = "kind",
  lazy = "lazy",
  left = "left",
  let = "let",
  line = "line",
  linear = "linear",
  lowerThan = "lowerThan",
  macro = "macro",
  message = "message",
  metadata = "metadata",
  module = "module",
  mutableAddressWithNativeOwner = "mutableAddressWithNativeOwner",
  mutableAddressWithOwner = "mutableAddressWithOwner",
  mutating = "mutating",
  nil = "nil",
  noDerivative = "noDerivative",
  noasync = "noasync",
  noescape = "noescape",
  none = "none",
  nonisolated = "nonisolated",
  nonmutating = "nonmutating",
  objc = "objc",
  obsoleted = "obsoleted",
  of = "of",
  open = "open",
  operator = "operator",
  optional = "optional",
  override = "override",
  package = "package",
  postfix = "postfix",
  precedencegroup = "precedencegroup",
  preconcurrency = "preconcurrency",
  prefix = "prefix",
  private = "private",
  protocol = "protocol",
  public = "public",
  reasync = "reasync",
  renamed = "renamed",
  repeat = "repeat",
  required = "required",
  rethrows = "rethrows",
  retroactive = "retroactive",
  return = "return",
  reverse = "reverse",
  right = "right",
  safe = "safe",
  self = "self",
  sending = "sending",
  set = "set",
  some = "some",
  sourceFile = "sourceFile",
  spi = "spi",
  spiModule = "spiModule",
  static = "static",
  struct = "struct",
  subscript = "subscript",
  super = "super",
  swift = "swift",
  switch = "switch",
  target = "target",
  then = "then",
  throw = "throw",
  throws = "throws",
  transpose = "transpose",
  true = "true",
  try = "try",
  typealias = "typealias",
  unavailable = "unavailable",
  unchecked = "unchecked",
  unowned = "unowned",
  unsafe = "unsafe",
  unsafeAddress = "unsafeAddress",
  unsafeMutableAddress = "unsafeMutableAddress",
  var = "var",
  visibility = "visibility",
  weak = "weak",
  where = "where",
  while = "while",
  willSet = "willSet",
  witness_method = "witness_method",
  wrt = "wrt",
  yield = "yield",
}

export type PostfixQuestionMarkToken = Readonly<{
  kind: TokenKind.PostfixQuestionMark
}>

//#endregion

export type Node =
  | DeclNode
  | ExprNode
  | PatternNode
  | StmtNode
  | TypeNode
  | CollectionNode
  | AttributeListNode
  | AttributeNode
  | MiscellaneousNode

export enum NodeKind {
  // Declarations
  EnumCaseDecl,
  EnumDecl,
  InitializerDecl,
  StructDecl,
  TypeAliasDecl,
  VariableDecl,

  // Expressions
  ArrayExpr,
  AssignmentExpr,
  BinaryOperatorExpr,
  BooleanLiteralExpr,
  DeclReferenceExpr,
  FloatLiteralExpr,
  FunctionCallExpr,
  IfExpr,
  InfixOperatorExpr,
  IntegerLiteralExpr,
  MemberAccessExpr,
  NilLiteralExpr,
  StringLiteralExpr,
  SwitchExpr,
  TryExpr,
  TupleExpr,

  // Patterns
  ExpressionPattern,
  IdentifierPattern,

  // Statements
  ExpressionStmt,
  ThrowStmt,

  // Types
  ArrayType,
  CompositionType,
  DictionaryType,
  IdentifierType,
  OptionalType,
  SomeOrAnyType,
  TupleType,

  // Collections
  ArrayElementList,
  ArrayElement,
  AvailabilityArgumentList,
  AvailabilityArgument,
  CodeBlockItemList,
  CodeBlockItem,
  CompositionTypeElementList,
  CompositionTypeElement,
  ConditionElementList,
  ConditionElement,
  DeclModifierList,
  DeclModifier,
  DeclNameArgumentList,
  DeclNameArgument,
  EnumCaseElementList,
  EnumCaseElement,
  EnumCaseParameterList,
  EnumCaseParameter,
  FunctionParameterList,
  FunctionParameter,
  GenericArgumentList,
  GenericArgument,
  GenericParameterList,
  GenericParameter,
  InheritanceTypeList,
  InheritanceType,
  LabeledExprList,
  LabeledExpr,
  MemberBlockItemList,
  MemberBlockItem,
  PatternBindingList,
  PatternBinding,
  SwitchCaseItemList,
  SwitchCaseItem,
  SwitchCaseList,
  SwitchCase,
  TupleTypeElementList,
  TupleTypeElement,

  // Attributes
  AttributeList,
  Attribute,

  // Miscellaneous Nodes
  AvailabilityLabeledArgument,
  AvailabilityTokenArgument,
  CodeBlock,
  DeclNameArguments,
  EnumCaseParameterClause,
  FunctionEffectSpecifiers,
  FunctionParameterClause,
  FunctionSignature,
  GenericArgumentClause,
  GenericParameterClause,
  InheritanceClause,
  InitializerClause,
  MemberBlock,
  OptionalBindingCondition,
  ReturnClause,
  SwitchCaseLabel,
  SwitchDefaultLabel,
  ThrowsClause,
  TypeAnnotation,
  TypeInitializerClause,
}

//#region Declarations

export type DeclNode =
  | EnumCaseDeclNode
  | EnumDeclNode
  | InitializerDeclNode
  | StructDeclNode
  | TypeAliasDeclNode
  | VariableDeclNode

export type EnumCaseDeclNode = Readonly<{
  kind: NodeKind.EnumCaseDecl
  jsDoc?: SourceAst.Doc
  attributes?: AttributeListNode
  modifiers?: DeclModifierListNode
  elements: EnumCaseElementListNode
}>

export type EnumDeclNode = Readonly<{
  kind: NodeKind.EnumDecl
  jsDoc?: SourceAst.Doc
  attributes?: AttributeListNode
  modifiers?: DeclModifierListNode
  name: Token
  genericParameterClause?: GenericParameterClauseNode
  inheritanceClause?: InheritanceClauseNode
  memberBlock: MemberBlockNode
}>

export type InitializerDeclNode = Readonly<{
  kind: NodeKind.InitializerDecl
  jsDoc?: SourceAst.Doc
  attributes?: AttributeListNode
  modifiers?: DeclModifierListNode
  optionalMark?: Token
  genericParameterClause?: GenericParameterClauseNode
  signature: FunctionSignatureNode
  body: CodeBlockNode
}>

export type StructDeclNode = Readonly<{
  kind: NodeKind.StructDecl
  jsDoc?: SourceAst.Doc
  attributes?: AttributeListNode
  modifiers?: DeclModifierListNode
  name: Token
  genericParameterClause?: GenericParameterClauseNode
  inheritanceClause?: InheritanceClauseNode
  memberBlock: MemberBlockNode
}>

export type TypeAliasDeclNode = Readonly<{
  kind: NodeKind.TypeAliasDecl
  jsDoc?: SourceAst.Doc
  attributes?: AttributeListNode
  modifiers?: DeclModifierListNode
  name: Token
  genericParameterClause?: GenericParameterClauseNode
  initializer: TypeInitializerClauseNode
}>

export type VariableDeclNode = Readonly<{
  kind: NodeKind.VariableDecl
  jsDoc?: SourceAst.Doc
  attributes?: AttributeListNode
  modifiers?: DeclModifierListNode
  bindingSpecifier: Token
  bindings: PatternBindingListNode
}>

//#endregion

//#region Expressions

export type ExprNode =
  | ArrayExprNode
  | AssignmentExprNode
  | BinaryOperatorExprNode
  | BooleanLiteralExprNode
  | DeclReferenceExprNode
  | FloatLiteralExprNode
  | FunctionCallExprNode
  | IfExprNode
  | InfixOperatorExprNode
  | IntegerLiteralExprNode
  | MemberAccessExprNode
  | NilLiteralExprNode
  | StringLiteralExprNode
  | SwitchExprNode
  | TryExprNode
  | TupleExprNode

export type ArrayExprNode = Readonly<{
  kind: NodeKind.ArrayExpr
  elements: ArrayElementListNode
}>

export type AssignmentExprNode = Readonly<{
  kind: NodeKind.AssignmentExpr
}>

export type BinaryOperatorExprNode = Readonly<{
  kind: NodeKind.BinaryOperatorExpr
  operator: BinaryOperatorToken
}>

export type BooleanLiteralExprNode = Readonly<{
  kind: NodeKind.BooleanLiteralExpr
  value: boolean
}>

export type DeclReferenceExprNode = Readonly<{
  kind: NodeKind.DeclReferenceExpr
  baseName: Token
  argumentNames?: DeclNameArgumentsNode
}>

export type FloatLiteralExprNode = Readonly<{
  kind: NodeKind.FloatLiteralExpr
  value: number
}>

export type FunctionCallExprNode = Readonly<{
  kind: NodeKind.FunctionCallExpr
  calledExpression: ExprNode
  arguments: LabeledExprListNode
}>

export type IfExprNode = Readonly<{
  kind: NodeKind.IfExpr
  conditions: ConditionElementListNode
  body: CodeBlockNode
  elseBody?: CodeBlockNode | IfExprNode
}>

export type InfixOperatorExprNode = Readonly<{
  kind: NodeKind.InfixOperatorExpr
  leftOperand: ExprNode
  operator: ExprNode
  rightOperand: ExprNode
}>

export type IntegerLiteralExprNode = Readonly<{
  kind: NodeKind.IntegerLiteralExpr
  value: number
}>

export type MemberAccessExprNode = Readonly<{
  kind: NodeKind.MemberAccessExpr
  base?: ExprNode
  declName: DeclReferenceExprNode
}>

export type NilLiteralExprNode = Readonly<{
  kind: NodeKind.NilLiteralExpr
}>

export type StringLiteralExprNode = Readonly<{
  kind: NodeKind.StringLiteralExpr
  value: string
}>

export type SwitchExprNode = Readonly<{
  kind: NodeKind.SwitchExpr
  subject: ExprNode
  cases: SwitchCaseListNode
}>

export type TryExprNode = Readonly<{
  kind: NodeKind.TryExpr
  questionOrExclamationMark?: Token
  expression: ExprNode
}>

export type TupleExprNode = Readonly<{
  kind: NodeKind.TupleExpr
  elements: LabeledExprListNode
}>

//#endregion

//#region Patterns

export type PatternNode = ExpressionPatternNode | IdentifierPatternNode

export type ExpressionPatternNode = Readonly<{
  kind: NodeKind.ExpressionPattern
  expression: ExprNode
}>

export type IdentifierPatternNode = Readonly<{
  kind: NodeKind.IdentifierPattern
  name: string
}>

//#endregion

//#region Statements

export type StmtNode = ExpressionStmtNode | ThrowStmtNode

export type ExpressionStmtNode = Readonly<{
  kind: NodeKind.ExpressionStmt
  expression: ExprNode
}>

export type ThrowStmtNode = Readonly<{
  kind: NodeKind.ThrowStmt
  expression: ExprNode
}>

//#endregion

//#region Types

export type TypeNode =
  | ArrayTypeNode
  | CompositionTypeNode
  | DictionaryTypeNode
  | IdentifierTypeNode
  | OptionalTypeNode
  | SomeOrAnyTypeNode
  | TupleTypeNode

export type ArrayTypeNode = Readonly<{
  kind: NodeKind.ArrayType
  element: TypeNode
}>

export type CompositionTypeNode = Readonly<{
  kind: NodeKind.CompositionType
  elements: CompositionTypeElementListNode
}>

export type DictionaryTypeNode = Readonly<{
  kind: NodeKind.DictionaryType
  key: TypeNode
  value: TypeNode
}>

export type IdentifierTypeNode = Readonly<{
  kind: NodeKind.IdentifierType
  name: Token
  genericArgumentClause?: GenericArgumentClauseNode
}>

export type OptionalTypeNode = Readonly<{
  kind: NodeKind.OptionalType
  wrappedType: TypeNode
}>

export type SomeOrAnyTypeNode = Readonly<{
  kind: NodeKind.SomeOrAnyType
  someOrAnySpecifier: Token
  constraint: TypeNode
}>

export type TupleTypeNode = Readonly<{
  kind: NodeKind.TupleType
  elements: TupleTypeElementListNode
}>

//#endregion

//#region Collections

export type CollectionNode =
  | ArrayElementListNode
  | ArrayElementNode
  | AvailabilityArgumentListNode
  | AvailabilityArgumentNode
  | CodeBlockItemListNode
  | CodeBlockItemNode
  | CompositionTypeElementListNode
  | CompositionTypeElementNode
  | ConditionElementListNode
  | ConditionElementNode
  | DeclModifierListNode
  | DeclModifierNode
  | DeclNameArgumentListNode
  | DeclNameArgumentNode
  | EnumCaseElementListNode
  | EnumCaseElementNode
  | EnumCaseParameterListNode
  | EnumCaseParameterNode
  | FunctionParameterListNode
  | FunctionParameterNode
  | GenericArgumentListNode
  | GenericArgumentNode
  | GenericParameterListNode
  | GenericParameterNode
  | InheritanceTypeListNode
  | InheritanceTypeNode
  | LabeledExprListNode
  | LabeledExprNode
  | MemberBlockItemListNode
  | MemberBlockItemNode
  | PatternBindingListNode
  | PatternBindingNode
  | SwitchCaseItemListNode
  | SwitchCaseItemNode
  | SwitchCaseListNode
  | SwitchCaseNode
  | TupleTypeElementListNode
  | TupleTypeElementNode

export type ArrayElementListNode = Readonly<{
  kind: NodeKind.ArrayElementList
  elements: readonly ArrayElementNode[]
}>

export type ArrayElementNode = Readonly<{
  kind: NodeKind.ArrayElement
  expression: ExprNode
}>

export type AvailabilityArgumentListNode = Readonly<{
  kind: NodeKind.AvailabilityArgumentList
  arguments: readonly AvailabilityArgumentNode[]
}>

export type AvailabilityArgumentNode = Readonly<{
  kind: NodeKind.AvailabilityArgument
  argument: AvailabilityArgumentNode_Argument
}>

export type AvailabilityArgumentNode_Argument =
  | AvailabilityLabeledArgumentNode
  | AvailabilityTokenArgumentNode

export type CodeBlockItemListNode = Readonly<{
  kind: NodeKind.CodeBlockItemList
  items: readonly CodeBlockItemNode[]
}>

export type CodeBlockItemNode = Readonly<{
  kind: NodeKind.CodeBlockItem
  item: CodeBlockItemNode_Item
}>

export type CodeBlockItemNode_Item = DeclNode | StmtNode | ExprNode

export type CompositionTypeElementListNode = Readonly<{
  kind: NodeKind.CompositionTypeElementList
  elements: readonly CompositionTypeElementNode[]
}>

export type CompositionTypeElementNode = Readonly<{
  kind: NodeKind.CompositionTypeElement
  type: TypeNode
}>

export type ConditionElementListNode = Readonly<{
  kind: NodeKind.ConditionElementList
  elements: readonly ConditionElementNode[]
}>

export type ConditionElementNode = Readonly<{
  kind: NodeKind.ConditionElement
  type: ExprNode | OptionalBindingConditionNode
}>

export type DeclModifierListNode = Readonly<{
  kind: NodeKind.DeclModifierList
  modifiers: readonly DeclModifierNode[]
}>

export type DeclModifierNode = Readonly<{
  kind: NodeKind.DeclModifier
  name: Token
  detail?: Token
}>

export type DeclNameArgumentListNode = Readonly<{
  kind: NodeKind.DeclNameArgumentList
  arguments: readonly DeclNameArgumentNode[]
}>

export type DeclNameArgumentNode = Readonly<{
  kind: NodeKind.DeclNameArgument
  name: Token
}>

export type EnumCaseElementListNode = Readonly<{
  kind: NodeKind.EnumCaseElementList
  elements: readonly EnumCaseElementNode[]
}>

export type EnumCaseElementNode = Readonly<{
  kind: NodeKind.EnumCaseElement
  name: Token
  parameterClause?: EnumCaseParameterClauseNode
  rawValue?: InitializerClauseNode
}>

export type EnumCaseParameterListNode = Readonly<{
  kind: NodeKind.EnumCaseParameterList
  parameters: readonly EnumCaseParameterNode[]
}>

export type EnumCaseParameterNode = Readonly<{
  kind: NodeKind.EnumCaseParameter
  firstName?: Token
  secondName?: Token
  type: TypeNode
}>

export type FunctionParameterListNode = Readonly<{
  kind: NodeKind.FunctionParameterList
  parameters: readonly FunctionParameterNode[]
}>

export type FunctionParameterNode = Readonly<{
  kind: NodeKind.FunctionParameter
  attributes?: AttributeListNode
  modifiers?: DeclModifierListNode
  firstName?: Token
  secondName?: Token
  type: TypeNode
  defaultValue?: InitializerClauseNode
}>

export type GenericArgumentListNode = Readonly<{
  kind: NodeKind.GenericArgumentList
  arguments: readonly GenericArgumentNode[]
}>

export type GenericArgumentNode = Readonly<{
  kind: NodeKind.GenericArgument
  argument: TypeNode
}>

export type GenericParameterListNode = Readonly<{
  kind: NodeKind.GenericParameterList
  parameters: readonly GenericParameterNode[]
}>

export type GenericParameterNode = Readonly<{
  kind: NodeKind.GenericParameter
  name: Token
  inheritedType?: TypeNode
}>

export type InheritanceTypeListNode = Readonly<{
  kind: NodeKind.InheritanceTypeList
  types: readonly InheritanceTypeNode[]
}>

export type InheritanceTypeNode = Readonly<{
  kind: NodeKind.InheritanceType
  type: TypeNode
}>

export type LabeledExprListNode = Readonly<{
  kind: NodeKind.LabeledExprList
  expressions: readonly LabeledExprNode[]
}>

export type LabeledExprNode = Readonly<{
  kind: NodeKind.LabeledExpr
  label?: Token
  expression: ExprNode
}>

export type MemberBlockItemListNode = Readonly<{
  kind: NodeKind.MemberBlockItemList
  items: readonly MemberBlockItemNode[]
}>

export type MemberBlockItemNode = Readonly<{
  kind: NodeKind.MemberBlockItem
  decl: DeclNode
}>

export type PatternBindingListNode = Readonly<{
  kind: NodeKind.PatternBindingList
  bindings: readonly PatternBindingNode[]
}>

export type PatternBindingNode = Readonly<{
  kind: NodeKind.PatternBinding
  pattern: PatternNode
  typeAnnotation?: TypeAnnotationNode
  initializer?: InitializerClauseNode
}>

export type SwitchCaseItemListNode = Readonly<{
  kind: NodeKind.SwitchCaseItemList
  items: readonly SwitchCaseItemNode[]
}>

export type SwitchCaseItemNode = Readonly<{
  kind: NodeKind.SwitchCaseItem
  pattern: PatternNode
}>

export type SwitchCaseListNode = Readonly<{
  kind: NodeKind.SwitchCaseList
  cases: readonly SwitchCaseNode[]
}>

export type SwitchCaseNode = Readonly<{
  kind: NodeKind.SwitchCase
  attribute?: AttributeNode
  label: SwitchDefaultLabelNode | SwitchCaseLabelNode
  statements: CodeBlockItemListNode
}>

export type TupleTypeElementListNode = Readonly<{
  kind: NodeKind.TupleTypeElementList
  elements: readonly TupleTypeElementNode[]
}>

export type TupleTypeElementNode = Readonly<{
  kind: NodeKind.TupleTypeElement
  firstName?: Token
  secondName?: Token
  type: TypeNode
}>

//#endregion

//#region Attributes

export type AttributeListNode = Readonly<{
  kind: NodeKind.AttributeList
  attributes: readonly AttributeNode[]
}>

export type AttributeNode = Readonly<{
  kind: NodeKind.Attribute
  attributeName: TypeNode
  arguments: AttributeNode_Arguments
}>

export type AttributeNode_Arguments = AvailabilityArgumentListNode

//#endregion

//#region Miscellaneous Nodes

export type MiscellaneousNode =
  | AvailabilityLabeledArgumentNode
  | AvailabilityTokenArgumentNode
  | CodeBlockNode
  | DeclNameArgumentsNode
  | EnumCaseParameterClauseNode
  | FunctionEffectSpecifiersNode
  | FunctionParameterClauseNode
  | FunctionSignatureNode
  | GenericArgumentClauseNode
  | GenericParameterClauseNode
  | InheritanceClauseNode
  | InitializerClauseNode
  | MemberBlockNode
  | OptionalBindingConditionNode
  | ReturnClauseNode
  | SwitchCaseLabelNode
  | SwitchDefaultLabelNode
  | ThrowsClauseNode
  | TypeAnnotationNode
  | TypeInitializerClauseNode

export type AvailabilityLabeledArgumentNode = Readonly<{
  kind: NodeKind.AvailabilityLabeledArgument
  label: "message" | "renamed" | "introduced" | "obsoleted" | "deprecated"
  value: string
}>

export type AvailabilityTokenArgumentNode = Readonly<{
  kind: NodeKind.AvailabilityTokenArgument
  token: Token
}>

export type CodeBlockNode = Readonly<{
  kind: NodeKind.CodeBlock
  statements: CodeBlockItemListNode
}>

export type DeclNameArgumentsNode = Readonly<{
  kind: NodeKind.DeclNameArguments
  arguments: DeclNameArgumentListNode
}>

export type EnumCaseParameterClauseNode = Readonly<{
  kind: NodeKind.EnumCaseParameterClause
  parameters: EnumCaseParameterListNode
}>

export type FunctionEffectSpecifiersNode = Readonly<{
  kind: NodeKind.FunctionEffectSpecifiers
  asyncSpecifier?: Token
  throwsClause?: ThrowsClauseNode
}>

export type FunctionParameterClauseNode = Readonly<{
  kind: NodeKind.FunctionParameterClause
  parameters: FunctionParameterListNode
}>

export type FunctionSignatureNode = Readonly<{
  kind: NodeKind.FunctionSignature
  parameterClause: FunctionParameterClauseNode
  effectSpecifiers?: FunctionEffectSpecifiersNode
  returnClause?: ReturnClauseNode
}>

export type GenericArgumentClauseNode = Readonly<{
  kind: NodeKind.GenericArgumentClause
  arguments: GenericArgumentListNode
}>

export type GenericParameterClauseNode = Readonly<{
  kind: NodeKind.GenericParameterClause
  parameters: GenericParameterListNode
}>

export type InheritanceClauseNode = Readonly<{
  kind: NodeKind.InheritanceClause
  inheritedTypes: InheritanceTypeListNode
}>

export type InitializerClauseNode = Readonly<{
  kind: NodeKind.InitializerClause
  value: ExprNode
}>

export type MemberBlockNode = Readonly<{
  kind: NodeKind.MemberBlock
  members: MemberBlockItemListNode
}>

export type OptionalBindingConditionNode = Readonly<{
  kind: NodeKind.OptionalBindingCondition
  bindingSpecifier: Token
  pattern: PatternNode
  typeAnnotation?: TypeAnnotationNode
  initializer?: InitializerClauseNode
}>

export type ReturnClauseNode = Readonly<{
  kind: NodeKind.ReturnClause
  type: TypeNode
}>

export type SwitchCaseLabelNode = Readonly<{
  kind: NodeKind.SwitchCaseLabel
  caseItems: SwitchCaseItemListNode
}>

export type SwitchDefaultLabelNode = Readonly<{
  kind: NodeKind.SwitchDefaultLabel
}>

export type ThrowsClauseNode = Readonly<{
  kind: NodeKind.ThrowsClause
  throwsSpecifier: Token
  type?: TypeNode
}>

export type TypeAnnotationNode = Readonly<{
  kind: NodeKind.TypeAnnotation
  type: TypeNode
}>

export type TypeInitializerClauseNode = Readonly<{
  kind: NodeKind.TypeInitializerClause
  value: TypeNode
}>

//#endregion
