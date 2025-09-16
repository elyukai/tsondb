import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { EOL } from "node:os"
import { basename } from "node:path"
import { Doc } from "../../ast.js"
import { MetaInformation } from "../../main.js"
import {
  isCodeBlockNode,
  isEnumCaseDeclNode,
  isOptionalBindingConditionNode,
  isSwitchDefaultLabelNode,
} from "./ast/guards.ts"
import {
  ArrayElementListNode,
  ArrayElementNode,
  ArrayExprNode,
  ArrayTypeNode,
  AssignmentExprNode,
  AstRoot,
  AttributeListNode,
  AttributeNode,
  AttributeNode_Arguments,
  AvailabilityArgumentListNode,
  AvailabilityArgumentNode,
  AvailabilityArgumentNode_Argument,
  AvailabilityLabeledArgumentNode,
  AvailabilityTokenArgumentNode,
  BinaryOperatorExprNode,
  BinaryOperatorToken,
  BooleanLiteralExprNode,
  CodeBlockItemListNode,
  CodeBlockItemNode,
  CodeBlockItemNode_Item,
  CodeBlockNode,
  CompositionTypeElementListNode,
  CompositionTypeElementNode,
  CompositionTypeNode,
  ConditionElementListNode,
  ConditionElementNode,
  DeclModifierListNode,
  DeclModifierNode,
  DeclNameArgumentListNode,
  DeclNameArgumentNode,
  DeclNameArgumentsNode,
  DeclNode,
  DeclReferenceExprNode,
  DictionaryTypeNode,
  EnumCaseDeclNode,
  EnumCaseElementListNode,
  EnumCaseElementNode,
  EnumCaseParameterClauseNode,
  EnumCaseParameterListNode,
  EnumCaseParameterNode,
  EnumDeclNode,
  ExclamationMarkToken,
  ExpressionPatternNode,
  ExpressionStmtNode,
  ExprNode,
  FloatLiteralExprNode,
  FunctionCallExprNode,
  FunctionEffectSpecifiersNode,
  FunctionParameterClauseNode,
  FunctionParameterListNode,
  FunctionParameterNode,
  FunctionSignatureNode,
  GenericArgumentClauseNode,
  GenericArgumentListNode,
  GenericArgumentNode,
  GenericParameterClauseNode,
  GenericParameterListNode,
  GenericParameterNode,
  IdentifierPatternNode,
  IdentifierToken,
  IdentifierTypeNode,
  IfExprNode,
  InfixOperatorExprNode,
  InheritanceClauseNode,
  InheritanceTypeListNode,
  InheritanceTypeNode,
  InitializerClauseNode,
  InitializerDeclNode,
  IntegerLiteralExprNode,
  Keyword,
  KeywordToken,
  LabeledExprListNode,
  LabeledExprNode,
  MemberAccessExprNode,
  MemberBlockItemListNode,
  MemberBlockItemNode,
  MemberBlockNode,
  NilLiteralExprNode,
  NodeKind,
  OptionalBindingConditionNode,
  OptionalTypeNode,
  PatternBindingListNode,
  PatternBindingNode,
  PatternNode,
  PostfixQuestionMarkToken,
  ReturnClauseNode,
  SomeOrAnyTypeNode,
  StmtNode,
  StringLiteralExprNode,
  StructDeclNode,
  SwitchCaseItemListNode,
  SwitchCaseItemNode,
  SwitchCaseLabelNode,
  SwitchCaseListNode,
  SwitchCaseNode,
  SwitchDefaultLabelNode,
  SwitchExprNode,
  ThrowsClauseNode,
  ThrowStmtNode,
  Token,
  TokenKind,
  TryExprNode,
  TupleExprNode,
  TupleTypeElementListNode,
  TupleTypeElementNode,
  TupleTypeNode,
  TypeAliasDeclNode,
  TypeAnnotationNode,
  TypeInitializerClauseNode,
  TypeNode,
  VariableDeclNode,
} from "./ast/types.ts"

const prefixLines = (prefix: string, text: string, includeEmptyLines: boolean = false): string =>
  text
    .split(EOL)
    .map(line => (includeEmptyLines || line.length > 0 ? prefix + line : line))
    .join(EOL)

const applyIndentation = (indentLevel: number, text: string, spaces: number = 4): string =>
  prefixLines(" ".repeat(spaces * indentLevel), text)

const renderDocumentation = (jsDoc?: Doc): string =>
  jsDoc?.comment === undefined ? "" : prefixLines("/// ", jsDoc.comment, true) + EOL

const joinSyntax = (...syntaxes: (string | undefined)[]): string =>
  syntaxes.filter(isNotNullish).join("")

const renderLabel = (firstName: Token | undefined, secondName: Token | undefined) =>
  firstName !== undefined || secondName !== undefined
    ? `${[firstName, secondName]
        .filter(isNotNullish)
        .map(token => renderToken(token))
        .join(" ")}: `
    : ""

//#region Tokens

const renderToken = (token: Token): string => {
  switch (token.kind) {
    case TokenKind.BinaryOperator:
      return renderBinaryOperatorToken(token)
    case TokenKind.ExclamationMark:
      return renderExclamationMarkToken(token)
    case TokenKind.Identifier:
      return renderIdentifierToken(token)
    case TokenKind.Keyword:
      return renderKeywordToken(token)
    case TokenKind.PostfixQuestionMark:
      return renderPostfixQuestionMarkToken(token)
    default:
      return assertExhaustive(token)
  }
}

const renderBinaryOperatorToken = (token: BinaryOperatorToken): string => token.operator

const renderExclamationMarkToken = (_token: ExclamationMarkToken): string => "!"

const renderIdentifierToken = (token: IdentifierToken): string => token.identifier

const renderKeywordToken = (token: KeywordToken): string => token.keyword

const renderPostfixQuestionMarkToken = (_token: PostfixQuestionMarkToken): string => "?"

//#endregion

//#region Declarations

export const renderDeclNode = (node: DeclNode): string => {
  switch (node.kind) {
    case NodeKind.EnumCaseDecl:
      return renderEnumCaseDeclNode(node)
    case NodeKind.EnumDecl:
      return renderEnumDeclNode(node)
    case NodeKind.InitializerDecl:
      return renderInitializerDeclNode(node)
    case NodeKind.StructDecl:
      return renderStructDeclNode(node)
    case NodeKind.TypeAliasDecl:
      return renderTypeAliasDeclNode(node)
    case NodeKind.VariableDecl:
      return renderVariableDeclNode(node)
    default:
      return assertExhaustive(node)
  }
}

const renderEnumCaseDeclNode = (node: EnumCaseDeclNode): string =>
  joinSyntax(
    renderDocumentation(node.jsDoc),
    node.attributes && renderAttributeListNode(node.attributes),
    "case ",
    renderEnumCaseElementListNode(node.elements),
  )

const renderEnumDeclNode = (node: EnumDeclNode): string =>
  joinSyntax(
    renderDocumentation(node.jsDoc),
    node.attributes && renderAttributeListNode(node.attributes),
    node.modifiers && renderDeclModifierListNode(node.modifiers),
    "enum ",
    renderToken(node.name),
    node.genericParameterClause && renderGenericParameterClause(node.genericParameterClause),
    node.inheritanceClause && renderInheritanceClauseNode(node.inheritanceClause),
    renderMemberBlockNode(node.memberBlock),
  )

const renderInitializerDeclNode = (node: InitializerDeclNode): string =>
  joinSyntax(
    renderDocumentation(node.jsDoc),
    node.attributes && renderAttributeListNode(node.attributes),
    node.modifiers && renderDeclModifierListNode(node.modifiers),
    "init",
    node.optionalMark && renderToken(node.optionalMark),
    node.genericParameterClause && renderGenericParameterClause(node.genericParameterClause),
    renderFunctionSignatureNode(node.signature),
    renderCodeBlockNode(node.body),
  )

const renderStructDeclNode = (node: StructDeclNode): string =>
  joinSyntax(
    renderDocumentation(node.jsDoc),
    node.attributes && renderAttributeListNode(node.attributes),
    node.modifiers && renderDeclModifierListNode(node.modifiers),
    "struct ",
    renderToken(node.name),
    node.genericParameterClause && renderGenericParameterClause(node.genericParameterClause),
    node.inheritanceClause && renderInheritanceClauseNode(node.inheritanceClause),
    renderMemberBlockNode(node.memberBlock),
  )

const renderTypeAliasDeclNode = (node: TypeAliasDeclNode): string =>
  joinSyntax(
    renderDocumentation(node.jsDoc),
    node.attributes && renderAttributeListNode(node.attributes),
    node.modifiers && renderDeclModifierListNode(node.modifiers),
    "typealias ",
    renderToken(node.name),
    node.genericParameterClause && renderGenericParameterClause(node.genericParameterClause),
    renderTypeInitializerClauseNode(node.initializer),
  )

const renderVariableDeclNode = (node: VariableDeclNode): string =>
  joinSyntax(
    renderDocumentation(node.jsDoc),
    node.attributes && renderAttributeListNode(node.attributes),
    node.modifiers && renderDeclModifierListNode(node.modifiers),
    renderToken(node.bindingSpecifier),
    " ",
    renderPatternBindingListNode(node.bindings),
  )

//#endregion

//#region Expressions

const renderExprNode = (node: ExprNode): string => {
  switch (node.kind) {
    case NodeKind.ArrayExpr:
      return renderArrayExprNode(node)
    case NodeKind.AssignmentExpr:
      return renderAssignmentExprNode(node)
    case NodeKind.BinaryOperatorExpr:
      return renderBinaryOperatorExprNode(node)
    case NodeKind.BooleanLiteralExpr:
      return renderBooleanLiteralExprNode(node)
    case NodeKind.DeclReferenceExpr:
      return renderDeclReferenceExprNode(node)
    case NodeKind.FloatLiteralExpr:
      return renderFloatLiteralExprNode(node)
    case NodeKind.FunctionCallExpr:
      return renderFunctionCallExprNode(node)
    case NodeKind.IfExpr:
      return renderIfExprNode(node)
    case NodeKind.InfixOperatorExpr:
      return renderInfixOperatorExprNode(node)
    case NodeKind.IntegerLiteralExpr:
      return renderIntegerLiteralExprNode(node)
    case NodeKind.MemberAccessExpr:
      return renderMemberAccessExprNode(node)
    case NodeKind.NilLiteralExpr:
      return renderNilLiteralExprNode(node)
    case NodeKind.StringLiteralExpr:
      return renderStringLiteralExprNode(node)
    case NodeKind.SwitchExpr:
      return renderSwitchExprNode(node)
    case NodeKind.TryExpr:
      return renderTryExprNode(node)
    case NodeKind.TupleExpr:
      return renderTupleExprNode(node)
    default:
      return assertExhaustive(node)
  }
}

const renderArrayExprNode = (node: ArrayExprNode): string =>
  `[${renderArrayElementListNode(node.elements)}]`

const renderAssignmentExprNode = (_node: AssignmentExprNode): string => "="

const renderBinaryOperatorExprNode = (node: BinaryOperatorExprNode): string =>
  renderToken(node.operator)

const renderBooleanLiteralExprNode = (node: BooleanLiteralExprNode): string =>
  node.value ? "true" : "false"

const renderDeclReferenceExprNode = (node: DeclReferenceExprNode): string =>
  joinSyntax(
    renderToken(node.baseName),
    node.argumentNames && renderDeclNameArgumentsNode(node.argumentNames),
  )

const renderFloatLiteralExprNode = (node: FloatLiteralExprNode): string => node.value.toString()

const renderFunctionCallExprNode = (node: FunctionCallExprNode): string =>
  `${renderExprNode(node.calledExpression)}(${renderLabeledExprListNode(node.arguments)})`

const renderIfExprNode = (node: IfExprNode): string =>
  `if ${renderConditionElementListNode(node.conditions)}${renderCodeBlockNode(node.body)}${
    node.elseBody === undefined
      ? ""
      : isCodeBlockNode(node.elseBody)
        ? ` else${renderCodeBlockNode(node.elseBody)}`
        : ` else ${renderIfExprNode(node.elseBody)}`
  }`

const renderInfixOperatorExprNode = (node: InfixOperatorExprNode): string =>
  joinSyntax(
    renderExprNode(node.leftOperand),
    " ",
    renderExprNode(node.operator),
    " ",
    renderExprNode(node.rightOperand),
  )

const renderIntegerLiteralExprNode = (node: IntegerLiteralExprNode): string => node.value.toString()

const renderMemberAccessExprNode = (node: MemberAccessExprNode): string =>
  joinSyntax(
    node.base && renderExprNode(node.base),
    ".",
    renderDeclReferenceExprNode(node.declName),
  )

const renderNilLiteralExprNode = (_node: NilLiteralExprNode): string => Keyword.nil

const renderStringLiteralExprNode = (node: StringLiteralExprNode): string => `"${node.value}"`

const renderSwitchExprNode = (node: SwitchExprNode): string =>
  joinSyntax(
    "switch ",
    renderExprNode(node.subject),
    " {",
    EOL,
    renderSwitchCaseListNode(node.cases),
    EOL,
    "}",
  )

const renderTryExprNode = (node: TryExprNode): string =>
  `try${
    node.questionOrExclamationMark === undefined ? "" : renderToken(node.questionOrExclamationMark)
  } ${renderExprNode(node.expression)}`

const renderTupleExprNode = (node: TupleExprNode): string =>
  `(${renderLabeledExprListNode(node.elements)})`

//#endregion

//#region Patterns

const renderPatternNode = (node: PatternNode): string => {
  switch (node.kind) {
    case NodeKind.ExpressionPattern:
      return renderExpressionPatternNode(node)
    case NodeKind.IdentifierPattern:
      return renderIdentifierPatternNode(node)
    default:
      return assertExhaustive(node)
  }
}

const renderExpressionPatternNode = (node: ExpressionPatternNode): string =>
  renderExprNode(node.expression)

const renderIdentifierPatternNode = (node: IdentifierPatternNode): string => node.name

//#endregion

//#region Statements

const renderStmtNode = (node: StmtNode): string => {
  switch (node.kind) {
    case NodeKind.ExpressionStmt:
      return renderExpressionStmtNode(node)
    case NodeKind.ThrowStmt:
      return renderThrowStmtNode(node)
    default:
      return assertExhaustive(node)
  }
}

const renderExpressionStmtNode = (node: ExpressionStmtNode): string =>
  renderExprNode(node.expression)

const renderThrowStmtNode = (node: ThrowStmtNode): string =>
  `throw ${renderExprNode(node.expression)}`

//#endregion

//#region Types

const renderTypeNode = (node: TypeNode): string => {
  switch (node.kind) {
    case NodeKind.ArrayType:
      return renderArrayTypeNode(node)
    case NodeKind.CompositionType:
      return renderCompositionTypeNode(node)
    case NodeKind.DictionaryType:
      return renderDictionaryTypeNode(node)
    case NodeKind.IdentifierType:
      return renderIdentifierTypeNode(node)
    case NodeKind.OptionalType:
      return renderOptionalTypeNode(node)
    case NodeKind.SomeOrAnyType:
      return renderSomeOrAnyTypeNode(node)
    case NodeKind.TupleType:
      return renderTupleTypeNode(node)
    default:
      return assertExhaustive(node)
  }
}

const renderArrayTypeNode = (node: ArrayTypeNode): string => `[${renderTypeNode(node.element)}]`

const renderCompositionTypeNode = (node: CompositionTypeNode): string =>
  renderCompositionTypeElementListNode(node.elements)

const renderDictionaryTypeNode = (node: DictionaryTypeNode): string =>
  `[${renderTypeNode(node.key)}: ${renderTypeNode(node.value)}]`

const renderIdentifierTypeNode = (node: IdentifierTypeNode): string =>
  joinSyntax(
    renderToken(node.name),
    node.genericArgumentClause && renderGenericArgumentClause(node.genericArgumentClause),
  )

const renderOptionalTypeNode = (node: OptionalTypeNode): string =>
  `${renderTypeNode(node.wrappedType)}?`

const renderSomeOrAnyTypeNode = (node: SomeOrAnyTypeNode): string =>
  `${renderToken(node.someOrAnySpecifier)} ${renderTypeNode(node.constraint)}`

const renderTupleTypeNode = (node: TupleTypeNode): string =>
  `(${renderTupleTypeElementListNode(node.elements)})`

//#endregion

//#region Collections

const renderAvailabilityArgumentListNode = (node: AvailabilityArgumentListNode): string =>
  node.arguments.map(renderAvailabilityArgumentNode).join(", ")

const renderAvailabilityArgumentNode = (node: AvailabilityArgumentNode): string =>
  renderAvailabilityArgumentNode_Argument(node.argument)

const renderAvailabilityArgumentNode_Argument = (
  node: AvailabilityArgumentNode_Argument,
): string => {
  switch (node.kind) {
    case NodeKind.AvailabilityLabeledArgument:
      return renderAvailabilityLabeledArgumentNode(node)
    case NodeKind.AvailabilityTokenArgument:
      return renderAvailabilityTokenArgumentNode(node)
    default:
      return assertExhaustive(node)
  }
}

const renderCodeBlockItemListNode = (node: CodeBlockItemListNode): string =>
  node.items.map(renderCodeBlockItemNode).join(EOL)

const renderCodeBlockItemNode = (node: CodeBlockItemNode): string =>
  renderCodeBlockItemNode_Item(node.item)

const renderCodeBlockItemNode_Item = (node: CodeBlockItemNode_Item): string => {
  switch (node.kind) {
    case NodeKind.EnumCaseDecl:
    case NodeKind.EnumDecl:
    case NodeKind.InitializerDecl:
    case NodeKind.StructDecl:
    case NodeKind.TypeAliasDecl:
    case NodeKind.VariableDecl:
      return renderDeclNode(node)
    case NodeKind.ArrayExpr:
    case NodeKind.AssignmentExpr:
    case NodeKind.BinaryOperatorExpr:
    case NodeKind.BooleanLiteralExpr:
    case NodeKind.DeclReferenceExpr:
    case NodeKind.FloatLiteralExpr:
    case NodeKind.FunctionCallExpr:
    case NodeKind.IfExpr:
    case NodeKind.InfixOperatorExpr:
    case NodeKind.IntegerLiteralExpr:
    case NodeKind.MemberAccessExpr:
    case NodeKind.NilLiteralExpr:
    case NodeKind.StringLiteralExpr:
    case NodeKind.SwitchExpr:
    case NodeKind.TryExpr:
    case NodeKind.TupleExpr:
      return renderExprNode(node)
    case NodeKind.ExpressionStmt:
    case NodeKind.ThrowStmt:
      return renderStmtNode(node)
    default:
      return assertExhaustive(node)
  }
}

const renderArrayElementListNode = (node: ArrayElementListNode): string =>
  node.elements.map(renderArrayElementNode).join(", ")

const renderArrayElementNode = (node: ArrayElementNode): string => renderExprNode(node.expression)

const renderCompositionTypeElementListNode = (node: CompositionTypeElementListNode): string =>
  node.elements.map(renderCompositionTypeElementNode).join(" & ")

const renderCompositionTypeElementNode = (node: CompositionTypeElementNode): string =>
  renderTypeNode(node.type)

const renderConditionElementListNode = (node: ConditionElementListNode): string =>
  node.elements.map(renderConditionElementNode).join(", ")

const renderConditionElementNode = (node: ConditionElementNode): string =>
  isOptionalBindingConditionNode(node.type)
    ? renderOptionalBindingConditionNode(node.type)
    : renderExprNode(node.type)

const renderDeclModifierListNode = (node: DeclModifierListNode): string =>
  `${node.modifiers.map(renderDeclModifierNode).join(" ")} `

const renderDeclModifierNode = (node: DeclModifierNode): string =>
  joinSyntax(renderToken(node.name), node.detail && `(${renderToken(node.detail)})`)

const renderDeclNameArgumentListNode = (node: DeclNameArgumentListNode): string =>
  node.arguments.map(renderDeclNameArgumentNode).join(", ")

const renderDeclNameArgumentNode = (node: DeclNameArgumentNode): string => renderToken(node.name)

const renderEnumCaseElementListNode = (node: EnumCaseElementListNode): string =>
  node.elements.map(renderEnumCaseElementNode).join(", ")

const renderEnumCaseElementNode = (node: EnumCaseElementNode): string =>
  joinSyntax(
    renderToken(node.name),
    node.parameterClause && renderEnumCaseParameterClauseNode(node.parameterClause),
    node.rawValue && renderInitializerClauseNode(node.rawValue),
  )

const renderEnumCaseParameterListNode = (node: EnumCaseParameterListNode): string =>
  node.parameters.map(renderEnumCaseParameterNode).join(", ")

const renderEnumCaseParameterNode = (node: EnumCaseParameterNode): string =>
  joinSyntax(renderLabel(node.firstName, node.secondName), renderTypeNode(node.type))

const renderFunctionParameterList = (node: FunctionParameterListNode): string =>
  node.parameters.map(renderFunctionParameterNode).join(", ")

const renderFunctionParameterNode = (node: FunctionParameterNode): string =>
  joinSyntax(
    node.attributes && renderAttributeListNode(node.attributes).split(EOL).join(" "),
    node.modifiers && renderDeclModifierListNode(node.modifiers),
    renderLabel(node.firstName, node.secondName),
    renderTypeNode(node.type),
    node.defaultValue && renderInitializerClauseNode(node.defaultValue),
  )

const renderGenericArgumentListNode = (node: GenericArgumentListNode): string =>
  node.arguments.map(renderGenericArgumentNode).join(", ")

const renderGenericArgumentNode = (node: GenericArgumentNode): string =>
  renderTypeNode(node.argument)

const renderGenericParameterListNode = (node: GenericParameterListNode): string =>
  node.parameters.map(renderGenericParameterNode).join(", ")

const renderGenericParameterNode = (node: GenericParameterNode): string =>
  `${renderToken(node.name)}${node.inheritedType ? `: ${renderTypeNode(node.inheritedType)}` : ""}`

const renderInheritanceTypeListNode = (node: InheritanceTypeListNode): string =>
  node.types.map(renderInheritanceTypeNode).join(", ")

const renderInheritanceTypeNode = (node: InheritanceTypeNode): string => renderTypeNode(node.type)

const renderLabeledExprListNode = (node: LabeledExprListNode): string =>
  node.expressions.map(renderLabeledExprNode).join(", ")

const renderLabeledExprNode = (node: LabeledExprNode): string =>
  `${
    node.label === undefined ? "" : `${renderToken(node.label)}: `
  }${renderExprNode(node.expression)}`

const renderMemberBlockItemListNode = (node: MemberBlockItemListNode): string =>
  node.items
    .map(
      (item, idx) =>
        (idx === 0
          ? ""
          : isEnumCaseDeclNode(item.decl) &&
              isEnumCaseDeclNode(node.items[idx - 1]!.decl) &&
              item.decl.jsDoc === undefined
            ? EOL
            : EOL + EOL) + renderMemberBlockItemNode(item),
    )
    .join("")

const renderMemberBlockItemNode = (node: MemberBlockItemNode): string => renderDeclNode(node.decl)

const renderPatternBindingListNode = (node: PatternBindingListNode): string =>
  node.bindings.map(renderPatternBindingNode).join(", ")

const renderPatternBindingNode = (node: PatternBindingNode): string =>
  joinSyntax(
    renderPatternNode(node.pattern),
    node.typeAnnotation && renderTypeAnnotationNode(node.typeAnnotation),
    node.initializer && renderInitializerClauseNode(node.initializer),
  )

const renderSwitchCaseItemListNode = (node: SwitchCaseItemListNode): string =>
  node.items.map(renderSwitchCaseItemNode).join(EOL + EOL)

const renderSwitchCaseItemNode = (node: SwitchCaseItemNode): string =>
  renderPatternNode(node.pattern)

const renderSwitchCaseListNode = (node: SwitchCaseListNode): string =>
  node.cases.map(renderSwitchCaseNode).join(EOL)

const renderSwitchCaseNode = (node: SwitchCaseNode): string =>
  joinSyntax(
    node.attribute && renderAttributeNode(node.attribute),
    isSwitchDefaultLabelNode(node.label)
      ? renderSwitchDefaultLabelNode(node.label)
      : renderSwitchCaseLabelNode(node.label),
    ":",
    EOL,
    applyIndentation(1, renderCodeBlockItemListNode(node.statements)),
  )

const renderTupleTypeElementListNode = (node: TupleTypeElementListNode): string =>
  node.elements.map(renderTupleTypeElementNode).join(", ")

const renderTupleTypeElementNode = (node: TupleTypeElementNode): string =>
  joinSyntax(renderLabel(node.firstName, node.secondName), renderTypeNode(node.type))

//#endregion

//#region Attributes

const renderAttributeListNode = (node: AttributeListNode): string =>
  node.attributes.map(renderAttributeNode).join(EOL) + EOL

const renderAttributeNode = (node: AttributeNode): string =>
  `@${renderTypeNode(node.attributeName)}(${renderAttributeNode_Arguments(node.arguments)})`

const renderAttributeNode_Arguments = (node: AttributeNode_Arguments): string =>
  renderAvailabilityArgumentListNode(node)

//#endregion

//#region Miscellaneous Nodes

const renderAvailabilityLabeledArgumentNode = (node: AvailabilityLabeledArgumentNode): string =>
  `${node.label}: ${node.value}`

const renderAvailabilityTokenArgumentNode = (node: AvailabilityTokenArgumentNode): string =>
  renderToken(node.token)

const renderCodeBlockNode = (node: CodeBlockNode): string =>
  ` {${EOL}${applyIndentation(1, renderCodeBlockItemListNode(node.statements))}\n}`

const renderDeclNameArgumentsNode = (node: DeclNameArgumentsNode): string =>
  `<${renderDeclNameArgumentListNode(node.arguments)}>`

const renderEnumCaseParameterClauseNode = (node: EnumCaseParameterClauseNode): string =>
  `(${renderEnumCaseParameterListNode(node.parameters)})`

const renderFunctionEffectSpecifiersNode = (node: FunctionEffectSpecifiersNode): string =>
  joinSyntax(
    node.asyncSpecifier && " " + renderToken(node.asyncSpecifier),
    node.throwsClause && " " + renderThrowsClauseNode(node.throwsClause),
  )

const renderFunctionParameterClauseNode = (node: FunctionParameterClauseNode): string =>
  `(${renderFunctionParameterList(node.parameters)})`

const renderFunctionSignatureNode = (node: FunctionSignatureNode): string =>
  joinSyntax(
    renderFunctionParameterClauseNode(node.parameterClause),
    node.effectSpecifiers && renderFunctionEffectSpecifiersNode(node.effectSpecifiers),
    node.returnClause && renderReturnClauseNode(node.returnClause),
  )

const renderGenericArgumentClause = (node: GenericArgumentClauseNode): string =>
  `<${renderGenericArgumentListNode(node.arguments)}>`

const renderGenericParameterClause = (node: GenericParameterClauseNode): string =>
  `<${renderGenericParameterListNode(node.parameters)}>`

const renderInheritanceClauseNode = (node: InheritanceClauseNode): string =>
  `: ${renderInheritanceTypeListNode(node.inheritedTypes)}`

const renderInitializerClauseNode = (node: InitializerClauseNode): string =>
  " = " + renderExprNode(node.value)

const renderMemberBlockNode = (node: MemberBlockNode): string =>
  ` {${EOL}${applyIndentation(1, renderMemberBlockItemListNode(node.members))}${EOL}}`

const renderOptionalBindingConditionNode = (node: OptionalBindingConditionNode): string =>
  joinSyntax(
    renderToken(node.bindingSpecifier),
    " ",
    renderPatternNode(node.pattern),
    node.typeAnnotation && renderTypeAnnotationNode(node.typeAnnotation),
    node.initializer && renderInitializerClauseNode(node.initializer),
  )

const renderSwitchCaseLabelNode = (node: SwitchCaseLabelNode): string =>
  `case ${renderSwitchCaseItemListNode(node.caseItems)}`

const renderSwitchDefaultLabelNode = (_node: SwitchDefaultLabelNode): string => `default`

const renderReturnClauseNode = (node: ReturnClauseNode): string =>
  ` -> ${renderTypeNode(node.type)}`

const renderThrowsClauseNode = (node: ThrowsClauseNode): string =>
  joinSyntax(renderToken(node.throwsSpecifier), node.type && `(${renderTypeNode(node.type)})`)

const renderTypeAnnotationNode = (node: TypeAnnotationNode): string =>
  `: ${renderTypeNode(node.type)}`

const renderTypeInitializerClauseNode = (node: TypeInitializerClauseNode): string =>
  ` = ${renderTypeNode(node.value)}`

//#endregion

const renderFileHeader = (absolutePath: string, packageName: string) =>
  prefixLines(
    "//",
    applyIndentation(1, ["", basename(absolutePath), packageName, ""].join(EOL), 2),
    true,
  )

export const renderAstRoot = (
  ast: AstRoot,
  meta: MetaInformation,
  options: RendererOptions,
): string =>
  joinSyntax(
    renderFileHeader(meta.absolutePath, options.packageName),
    EOL,
    EOL,
    ast.map(node => renderDeclNode(node)).join(EOL + EOL),
    EOL,
  )

export type RendererOptions = {
  packageName: string
}
