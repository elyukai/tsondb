import { isIfExprNode } from "./guards.ts"
import * as Ast from "./types.ts"

export const cleanupUndefinedKeys = <T extends object>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as T

//#region Tokens

export const binaryOperatorToken = (operator: string): Ast.BinaryOperatorToken => ({
  kind: Ast.TokenKind.BinaryOperator,
  operator,
})

export const exclamationMarkToken: Ast.ExclamationMarkToken = {
  kind: Ast.TokenKind.ExclamationMark,
}

export const identifierToken = (identifier: string): Ast.IdentifierToken => ({
  kind: Ast.TokenKind.Identifier,
  identifier,
})

export const keywordToken = (keyword: Ast.Keyword): Ast.KeywordToken => ({
  kind: Ast.TokenKind.Keyword,
  keyword,
})

export const postfixQuestionMarkToken: Ast.PostfixQuestionMarkToken = {
  kind: Ast.TokenKind.PostfixQuestionMark,
}

//#endregion

//#region Declarations

export const enumCaseDecl = (
  options: {
    comment?: string
    attributes?: Ast.AttributeListNode
    modifiers?: readonly Ast.DeclModifierNode[]
  },
  elements: readonly Ast.EnumCaseElementNode[],
): Ast.EnumCaseDeclNode =>
  cleanupUndefinedKeys({
    ...options,
    kind: Ast.NodeKind.EnumCaseDecl,
    modifiers: options.modifiers && declModifierList(options.modifiers),
    elements: enumCaseElementList(elements),
  })

export const enumDecl = (
  name: string,
  options: {
    comment?: string
    attributes?: Ast.AttributeListNode
    modifiers?: readonly Ast.DeclModifierNode[]
    genericParameterClause?: Ast.GenericParameterClauseNode
    inheritanceClause?: readonly Ast.TypeNode[]
  },
  members: readonly Ast.DeclNode[],
): Ast.EnumDeclNode =>
  cleanupUndefinedKeys({
    ...options,
    kind: Ast.NodeKind.EnumDecl,
    modifiers: options.modifiers && declModifierList(options.modifiers),
    name: identifierToken(name),
    inheritanceClause: options.inheritanceClause && inheritanceClause(options.inheritanceClause),
    memberBlock: memberBlock(members),
  })

export const initializerDecl = (
  options: {
    comment?: string
    attributes?: Ast.AttributeListNode
    modifiers?: readonly Ast.DeclModifierNode[]
    optionalMark?: Ast.Token
    genericParameterClause?: Ast.GenericParameterClauseNode
    inheritanceClause?: readonly Ast.TypeNode[]
  },
  signature: Ast.FunctionSignatureNode,
  body: readonly Ast.CodeBlockItemNode_Item[],
): Ast.InitializerDeclNode =>
  cleanupUndefinedKeys({
    ...options,
    kind: Ast.NodeKind.InitializerDecl,
    modifiers: options.modifiers && declModifierList(options.modifiers),
    signature: signature,
    body: codeBlock(body),
  })

export const structDecl = (
  name: string,
  options: {
    comment?: string
    attributes?: Ast.AttributeListNode
    modifiers?: readonly Ast.DeclModifierNode[]
    genericParameterClause?: Ast.GenericParameterClauseNode
    inheritanceClause?: readonly Ast.TypeNode[]
  },
  members: readonly Ast.DeclNode[],
): Ast.StructDeclNode =>
  cleanupUndefinedKeys({
    ...options,
    kind: Ast.NodeKind.StructDecl,
    modifiers: options.modifiers && declModifierList(options.modifiers),
    name: identifierToken(name),
    inheritanceClause: options.inheritanceClause && inheritanceClause(options.inheritanceClause),
    memberBlock: memberBlock(members),
  })

export const typeAliasDecl = (
  name: string,
  options: {
    comment?: string
    attributes?: Ast.AttributeListNode
    modifiers?: readonly Ast.DeclModifierNode[]
    genericParameterClause?: Ast.GenericParameterClauseNode
  },
  initializer: Ast.TypeNode,
): Ast.TypeAliasDeclNode =>
  cleanupUndefinedKeys({
    ...options,
    kind: Ast.NodeKind.TypeAliasDecl,
    modifiers: options.modifiers && declModifierList(options.modifiers),
    name: identifierToken(name),
    initializer: typeInitializerClause(initializer),
  })

export const variableDecl = (
  options: {
    comment?: string
    attributes?: Ast.AttributeListNode
    modifiers?: readonly Ast.DeclModifierNode[]
  },
  bindingSpecifier: Ast.Keyword,
  bindings: readonly Ast.PatternBindingNode[],
): Ast.VariableDeclNode =>
  cleanupUndefinedKeys({
    ...options,
    kind: Ast.NodeKind.VariableDecl,
    modifiers: options.modifiers && declModifierList(options.modifiers),
    bindingSpecifier: keywordToken(bindingSpecifier),
    bindings: patternBindingList(bindings),
  })

//#endregion

//#region Expressions

export const arrayExpr = (elements: readonly Ast.ExprNode[]): Ast.ArrayExprNode => ({
  kind: Ast.NodeKind.ArrayExpr,
  elements: arrayElementList(elements),
})

export const assignmentExpr: Ast.AssignmentExprNode = {
  kind: Ast.NodeKind.AssignmentExpr,
}

export const binaryOperatorExpr = (operator: string): Ast.BinaryOperatorExprNode => ({
  kind: Ast.NodeKind.BinaryOperatorExpr,
  operator: binaryOperatorToken(operator),
})

export const booleanLiteralExpr = (value: boolean): Ast.BooleanLiteralExprNode => ({
  kind: Ast.NodeKind.BooleanLiteralExpr,
  value,
})

export const declReferenceExpr = (
  baseName: Ast.Token,
  argumentNames?: readonly Ast.DeclNameArgumentNode[],
): Ast.DeclReferenceExprNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.DeclReferenceExpr,
    baseName,
    argumentNames: argumentNames && declNameArguments(argumentNames),
  })

export const floatLiteralExpr = (value: number): Ast.FloatLiteralExprNode => ({
  kind: Ast.NodeKind.FloatLiteralExpr,
  value,
})

export const functionCallExpr = (
  calledExpression: Ast.ExprNode,
  args: readonly Ast.LabeledExprNode[] = [],
): Ast.FunctionCallExprNode => ({
  kind: Ast.NodeKind.FunctionCallExpr,
  calledExpression,
  arguments: labeledExprList(args),
})

export const ifExpr = (
  conditions: readonly Ast.ConditionElementNode["type"][],
  body: readonly Ast.CodeBlockItemNode_Item[],
  elseBody?: readonly Ast.CodeBlockItemNode_Item[] | Ast.IfExprNode,
): Ast.IfExprNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.IfExpr,
    conditions: conditionElementList(conditions),
    body: codeBlock(body),
    elseBody:
      elseBody === undefined ? undefined : isIfExprNode(elseBody) ? elseBody : codeBlock(elseBody),
  })

export const infixOperatorExpr = (
  leftOperand: Ast.ExprNode,
  operator: Ast.ExprNode,
  rightOperand: Ast.ExprNode,
): Ast.InfixOperatorExprNode => ({
  kind: Ast.NodeKind.InfixOperatorExpr,
  leftOperand,
  operator,
  rightOperand,
})

export const integerLiteralExpr = (value: number): Ast.IntegerLiteralExprNode => ({
  kind: Ast.NodeKind.IntegerLiteralExpr,
  value,
})

export const memberAccessExpr = (
  declName: Ast.DeclReferenceExprNode,
  base?: Ast.ExprNode,
): Ast.MemberAccessExprNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.MemberAccessExpr,
    base,
    declName,
  })

export const nilLiteralExpr: Ast.NilLiteralExprNode = {
  kind: Ast.NodeKind.NilLiteralExpr,
}

export const stringLiteralExpr = (value: string): Ast.StringLiteralExprNode => ({
  kind: Ast.NodeKind.StringLiteralExpr,
  value,
})

export const switchExpr = (
  subject: Ast.ExprNode,
  cases: readonly Ast.SwitchCaseNode[],
): Ast.SwitchExprNode => ({
  kind: Ast.NodeKind.SwitchExpr,
  subject,
  cases: switchCaseList(cases),
})

export const tryExpr = (
  expression: Ast.ExprNode,
  questionOrExclamationMark?: Ast.Token,
): Ast.TryExprNode => ({
  kind: Ast.NodeKind.TryExpr,
  questionOrExclamationMark,
  expression,
})

export const tupleExpr = (elements: readonly Ast.LabeledExprNode[]): Ast.TupleExprNode => ({
  kind: Ast.NodeKind.TupleExpr,
  elements: labeledExprList(elements),
})

//#endregion

//#region Patterns

export const expressionPattern = (expression: Ast.ExprNode): Ast.ExpressionPatternNode => ({
  kind: Ast.NodeKind.ExpressionPattern,
  expression,
})

export const identifierPattern = (name: string): Ast.IdentifierPatternNode => ({
  kind: Ast.NodeKind.IdentifierPattern,
  name,
})

//#endregion

//#region Statements

export const expressionStmt = (expression: Ast.ExprNode): Ast.ExpressionStmtNode => ({
  kind: Ast.NodeKind.ExpressionStmt,
  expression,
})

export const throwStmt = (expression: Ast.ExprNode): Ast.ThrowStmtNode => ({
  kind: Ast.NodeKind.ThrowStmt,
  expression,
})

//#endregion

//#region Types

export const arrayType = (element: Ast.TypeNode): Ast.ArrayTypeNode => ({
  kind: Ast.NodeKind.ArrayType,
  element,
})

export const compositionType = (
  elements: readonly Ast.CompositionTypeElementNode[],
): Ast.CompositionTypeNode => ({
  kind: Ast.NodeKind.CompositionType,
  elements: compositionTypeElementList(elements),
})

export const dictionaryType = (key: Ast.TypeNode, value: Ast.TypeNode): Ast.DictionaryTypeNode => ({
  kind: Ast.NodeKind.DictionaryType,
  key,
  value,
})

export const identifierType = (
  name: string,
  genericArguments?: readonly Ast.GenericArgumentNode[],
): Ast.IdentifierTypeNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.IdentifierType,
    name: identifierToken(name),
    genericArgumentClause: genericArguments && genericArgumentClause(genericArguments),
  })

export const optionalType = (wrappedType: Ast.TypeNode): Ast.OptionalTypeNode => ({
  kind: Ast.NodeKind.OptionalType,
  wrappedType,
})

export const someOrAnyType = (
  someOrAnySpecifier: Ast.Keyword.some | Ast.Keyword.any,
  constraint: Ast.TypeNode,
): Ast.SomeOrAnyTypeNode => ({
  kind: Ast.NodeKind.SomeOrAnyType,
  someOrAnySpecifier: keywordToken(someOrAnySpecifier),
  constraint,
})

export const tupleType = (elements: readonly Ast.TupleTypeElementNode[]): Ast.TupleTypeNode => ({
  kind: Ast.NodeKind.TupleType,
  elements: tupleTypeElementList(elements),
})

//#endregion

//#region Collections

export const arrayElementList = (elements: readonly Ast.ExprNode[]): Ast.ArrayElementListNode => ({
  kind: Ast.NodeKind.ArrayElementList,
  elements: elements.map(element => arrayElement(element)),
})

export const arrayElement = (expression: Ast.ExprNode): Ast.ArrayElementNode => ({
  kind: Ast.NodeKind.ArrayElement,
  expression,
})

export const availabilityArgumentList = (
  args: readonly Ast.AvailabilityArgumentNode_Argument[],
): Ast.AvailabilityArgumentListNode => ({
  kind: Ast.NodeKind.AvailabilityArgumentList,
  arguments: args.map(arg => availabilityArgument(arg)),
})

export const availabilityArgument = (
  argument: Ast.AvailabilityArgumentNode_Argument,
): Ast.AvailabilityArgumentNode => ({
  kind: Ast.NodeKind.AvailabilityArgument,
  argument,
})

export const codeBlockItemList = (
  items: readonly Ast.CodeBlockItemNode_Item[],
): Ast.CodeBlockItemListNode => ({
  kind: Ast.NodeKind.CodeBlockItemList,
  items: items.map(item => codeBlockItem(item)),
})

export const codeBlockItem = (item: Ast.CodeBlockItemNode_Item): Ast.CodeBlockItemNode => ({
  kind: Ast.NodeKind.CodeBlockItem,
  item,
})

export const compositionTypeElementList = (
  elements: readonly Ast.CompositionTypeElementNode[],
): Ast.CompositionTypeElementListNode => ({
  kind: Ast.NodeKind.CompositionTypeElementList,
  elements,
})

export const compositionTypeElement = (type: Ast.TypeNode): Ast.CompositionTypeElementNode => ({
  kind: Ast.NodeKind.CompositionTypeElement,
  type,
})

export const conditionElementList = (
  elements: readonly Ast.ConditionElementNode["type"][],
): Ast.ConditionElementListNode => ({
  kind: Ast.NodeKind.ConditionElementList,
  elements: elements.map(type => conditionElement(type)),
})

export const conditionElement = (
  type: Ast.ExprNode | Ast.OptionalBindingConditionNode,
): Ast.ConditionElementNode => ({
  kind: Ast.NodeKind.ConditionElement,
  type,
})

export const declModifierList = (
  modifiers: readonly Ast.DeclModifierNode[],
): Ast.DeclModifierListNode => ({
  kind: Ast.NodeKind.DeclModifierList,
  modifiers,
})

export const declModifier = (name: Ast.Token, detail?: Ast.Token): Ast.DeclModifierNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.DeclModifier,
    name,
    detail,
  })

export const declNameArgumentList = (
  args: readonly Ast.DeclNameArgumentNode[],
): Ast.DeclNameArgumentListNode => ({
  kind: Ast.NodeKind.DeclNameArgumentList,
  arguments: args,
})

export const declNameArgument = (name: Ast.Token): Ast.DeclNameArgumentNode => ({
  kind: Ast.NodeKind.DeclNameArgument,
  name,
})

export const enumCaseElementList = (
  elements: readonly Ast.EnumCaseElementNode[],
): Ast.EnumCaseElementListNode => ({
  kind: Ast.NodeKind.EnumCaseElementList,
  elements: elements,
})

export const enumCaseElement = (
  name: string,
  parameters?: readonly Ast.EnumCaseParameterNode[],
  rawValue?: Ast.ExprNode,
): Ast.EnumCaseElementNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.EnumCaseElement,
    name: identifierToken(name),
    parameterClause: parameters && enumCaseParameterClause(parameters),
    rawValue: rawValue && initializerClause(rawValue),
  })

export const enumCaseParameterList = (
  parameters: readonly Ast.EnumCaseParameterNode[],
): Ast.EnumCaseParameterListNode => ({
  kind: Ast.NodeKind.EnumCaseParameterList,
  parameters,
})

export const enumCaseParameter = (
  type: Ast.TypeNode,
  firstName?: string,
  secondName?: string,
): Ast.EnumCaseParameterNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.EnumCaseParameter,
    firstName: firstName === undefined ? undefined : identifierToken(firstName),
    secondName: secondName === undefined ? undefined : identifierToken(secondName),
    type,
  })

export const functionParameterList = (
  parameters: readonly Ast.FunctionParameterNode[],
): Ast.FunctionParameterListNode => ({
  kind: Ast.NodeKind.FunctionParameterList,
  parameters,
})

export const functionParameter = (
  type: Ast.TypeNode,
  firstName?: string,
  secondName?: string,
  options: {
    attributes?: Ast.AttributeListNode
    modifiers?: Ast.DeclModifierListNode
    defaultValue?: Ast.ExprNode
  } = {},
): Ast.FunctionParameterNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.FunctionParameter,
    attributes: options.attributes,
    modifiers: options.modifiers,
    firstName: firstName === undefined ? undefined : identifierToken(firstName),
    secondName: secondName === undefined ? undefined : identifierToken(secondName),
    type,
    defaultValue: options.defaultValue && initializerClause(options.defaultValue),
  })

export const genericArgumentList = (
  args: readonly Ast.GenericArgumentNode[],
): Ast.GenericArgumentListNode => ({
  kind: Ast.NodeKind.GenericArgumentList,
  arguments: args,
})

export const genericArgument = (argument: Ast.TypeNode): Ast.GenericArgumentNode => ({
  kind: Ast.NodeKind.GenericArgument,
  argument,
})

export const genericParameterList = (
  parameters: readonly Ast.GenericParameterNode[],
): Ast.GenericParameterListNode => ({
  kind: Ast.NodeKind.GenericParameterList,
  parameters,
})

export const genericParameter = (
  name: string,
  inheritedType?: Ast.TypeNode,
): Ast.GenericParameterNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.GenericParameter,
    name: identifierToken(name),
    inheritedType,
  })

export const inheritanceTypeList = (
  types: readonly Ast.TypeNode[],
): Ast.InheritanceTypeListNode => ({
  kind: Ast.NodeKind.InheritanceTypeList,
  types: types.map(type => inheritanceType(type)),
})

export const inheritanceType = (type: Ast.TypeNode): Ast.InheritanceTypeNode => ({
  kind: Ast.NodeKind.InheritanceType,
  type,
})

export const labeledExprList = (
  expressions: readonly Ast.LabeledExprNode[],
): Ast.LabeledExprListNode => ({
  kind: Ast.NodeKind.LabeledExprList,
  expressions,
})

export const labeledExpr = (expression: Ast.ExprNode, label?: string): Ast.LabeledExprNode => ({
  kind: Ast.NodeKind.LabeledExpr,
  label: label === undefined ? undefined : identifierToken(label),
  expression,
})

export const memberBlockItemList = (
  items: readonly Ast.DeclNode[],
): Ast.MemberBlockItemListNode => ({
  kind: Ast.NodeKind.MemberBlockItemList,
  items: items.map(item => memberBlockItem(item)),
})

export const memberBlockItem = (decl: Ast.DeclNode): Ast.MemberBlockItemNode => ({
  kind: Ast.NodeKind.MemberBlockItem,
  decl,
})

export const patternBindingList = (
  bindings: readonly Ast.PatternBindingNode[],
): Ast.PatternBindingListNode => ({
  kind: Ast.NodeKind.PatternBindingList,
  bindings,
})

export const patternBinding = (
  pattern: Ast.PatternNode,
  annotatedType?: Ast.TypeNode,
  initializer?: Ast.ExprNode,
): Ast.PatternBindingNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.PatternBinding,
    pattern,
    typeAnnotation: annotatedType && typeAnnotation(annotatedType),
    initializer: initializer && initializerClause(initializer),
  })

export const switchCaseItemList = (
  items: readonly Ast.PatternNode[],
): Ast.SwitchCaseItemListNode => ({
  kind: Ast.NodeKind.SwitchCaseItemList,
  items: items.map(item => switchCaseItem(item)),
})

export const switchCaseItem = (pattern: Ast.PatternNode): Ast.SwitchCaseItemNode => ({
  kind: Ast.NodeKind.SwitchCaseItem,
  pattern,
})

export const switchCaseList = (cases: readonly Ast.SwitchCaseNode[]): Ast.SwitchCaseListNode => ({
  kind: Ast.NodeKind.SwitchCaseList,
  cases,
})

export const switchCase = (
  label: Ast.SwitchDefaultLabelNode | Ast.SwitchCaseLabelNode,
  statements: readonly Ast.CodeBlockItemNode_Item[],
  attribute?: Ast.AttributeNode,
): Ast.SwitchCaseNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.SwitchCase,
    label,
    statements: codeBlockItemList(statements),
    attribute,
  })

export const tupleTypeElementList = (
  elements: readonly Ast.TupleTypeElementNode[],
): Ast.TupleTypeElementListNode => ({
  kind: Ast.NodeKind.TupleTypeElementList,
  elements,
})

export const tupleTypeElement = (
  type: Ast.TypeNode,
  firstName?: string,
  secondName?: string,
): Ast.TupleTypeElementNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.TupleTypeElement,
    firstName: firstName === undefined ? undefined : identifierToken(firstName),
    secondName: secondName === undefined ? undefined : identifierToken(secondName),
    type,
  })

//#endregion

//#region Attributes

export const attributeList = (attributes: readonly Ast.AttributeNode[]): Ast.AttributeListNode => ({
  kind: Ast.NodeKind.AttributeList,
  attributes,
})

export const attribute = (
  attributeName: Ast.TypeNode,
  args: Ast.AttributeNode_Arguments,
): Ast.AttributeNode => ({
  kind: Ast.NodeKind.Attribute,
  attributeName,
  arguments: args,
})

//#endregion

//#region Miscellaneous Nodes

export const availabilityLabeledArgument = (
  label: "message" | "renamed" | "introduced" | "obsoleted" | "deprecated",
  value: string,
): Ast.AvailabilityLabeledArgumentNode => ({
  kind: Ast.NodeKind.AvailabilityLabeledArgument,
  label,
  value,
})

export const availabilityTokenArgument = (token: Ast.Token): Ast.AvailabilityTokenArgumentNode => ({
  kind: Ast.NodeKind.AvailabilityTokenArgument,
  token,
})

export const codeBlock = (items: readonly Ast.CodeBlockItemNode_Item[]): Ast.CodeBlockNode => ({
  kind: Ast.NodeKind.CodeBlock,
  statements: codeBlockItemList(items),
})

export const declNameArguments = (
  args: readonly Ast.DeclNameArgumentNode[],
): Ast.DeclNameArgumentsNode => ({
  kind: Ast.NodeKind.DeclNameArguments,
  arguments: declNameArgumentList(args),
})

export const enumCaseParameterClause = (
  parameters: readonly Ast.EnumCaseParameterNode[],
): Ast.EnumCaseParameterClauseNode => ({
  kind: Ast.NodeKind.EnumCaseParameterClause,
  parameters: enumCaseParameterList(parameters),
})

export const functionEffectSpecifiers = (options: {
  asyncSpecifier?: Ast.Keyword
  throwsClause?: Ast.ThrowsClauseNode
}): Ast.FunctionEffectSpecifiersNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.FunctionEffectSpecifiers,
    asyncSpecifier: options.asyncSpecifier && keywordToken(options.asyncSpecifier),
    throwsClause: options.throwsClause,
  })

export const functionParameterClause = (
  parameters: readonly Ast.FunctionParameterNode[],
): Ast.FunctionParameterClauseNode => ({
  kind: Ast.NodeKind.FunctionParameterClause,
  parameters: functionParameterList(parameters),
})

export const functionSignature = (
  parameters: readonly Ast.FunctionParameterNode[],
  effectSpecifiers?: Ast.FunctionEffectSpecifiersNode,
  returnClause?: Ast.ReturnClauseNode,
): Ast.FunctionSignatureNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.FunctionSignature,
    parameterClause: functionParameterClause(parameters),
    effectSpecifiers: effectSpecifiers,
    returnClause: returnClause,
  })

export const genericArgumentClause = (
  args: readonly Ast.GenericArgumentNode[],
): Ast.GenericArgumentClauseNode => ({
  kind: Ast.NodeKind.GenericArgumentClause,
  arguments: genericArgumentList(args),
})

export const genericParameterClause = (
  parameters: readonly Ast.GenericParameterNode[],
): Ast.GenericParameterClauseNode => ({
  kind: Ast.NodeKind.GenericParameterClause,
  parameters: genericParameterList(parameters),
})

export const inheritanceClause = (
  inheritedTypes: readonly Ast.TypeNode[],
): Ast.InheritanceClauseNode => ({
  kind: Ast.NodeKind.InheritanceClause,
  inheritedTypes: inheritanceTypeList(inheritedTypes),
})

export const initializerClause = (rawValue: Ast.ExprNode): Ast.InitializerClauseNode => ({
  kind: Ast.NodeKind.InitializerClause,
  value: rawValue,
})

export const memberBlock = (items: readonly Ast.DeclNode[]): Ast.MemberBlockNode => ({
  kind: Ast.NodeKind.MemberBlock,
  members: memberBlockItemList(items),
})

export const returnClause = (type: Ast.TypeNode): Ast.ReturnClauseNode => ({
  kind: Ast.NodeKind.ReturnClause,
  type,
})

export const optionalBindingCondition = (
  bindingSpecifier: Ast.Keyword.let | Ast.Keyword.var,
  pattern: Ast.PatternNode,
  annotatedType?: Ast.TypeNode,
  initializer?: Ast.ExprNode,
): Ast.OptionalBindingConditionNode => ({
  kind: Ast.NodeKind.OptionalBindingCondition,
  bindingSpecifier: keywordToken(bindingSpecifier),
  pattern,
  typeAnnotation: annotatedType && typeAnnotation(annotatedType),
  initializer: initializer && initializerClause(initializer),
})

export const switchCaseLabel = (
  caseItems: readonly Ast.PatternNode[],
): Ast.SwitchCaseLabelNode => ({
  kind: Ast.NodeKind.SwitchCaseLabel,
  caseItems: switchCaseItemList(caseItems),
})

export const switchDefaultLabel: Ast.SwitchDefaultLabelNode = {
  kind: Ast.NodeKind.SwitchDefaultLabel,
}

export const throwsClause = (
  throwsSpecifier: Ast.Keyword,
  type?: Ast.TypeNode,
): Ast.ThrowsClauseNode =>
  cleanupUndefinedKeys({
    kind: Ast.NodeKind.ThrowsClause,
    throwsSpecifier: keywordToken(throwsSpecifier),
    type,
  })

export const typeAnnotation = (type: Ast.TypeNode): Ast.TypeAnnotationNode => ({
  kind: Ast.NodeKind.TypeAnnotation,
  type,
})

export const typeInitializerClause = (value: Ast.TypeNode): Ast.TypeInitializerClauseNode => ({
  kind: Ast.NodeKind.TypeInitializerClause,
  value,
})

//#endregion
