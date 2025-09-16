import * as Ast from "./types.ts"

const isNodeObject = (node: unknown): node is { kind: unknown } =>
  typeof node === "object" && node !== null && Object.hasOwn(node, "kind")

//#region Declarations
// prettier-ignore
export const isEnumCaseDeclNode = (node: unknown): node is Ast.EnumCaseDeclNode => isNodeObject(node) && node.kind === Ast.NodeKind.EnumCaseDecl
// prettier-ignore
export const isEnumDeclNode = (node: unknown): node is Ast.EnumDeclNode => isNodeObject(node) && node.kind === Ast.NodeKind.EnumDecl
// prettier-ignore
export const isInitializerDeclNode = (node: unknown): node is Ast.InitializerDeclNode => isNodeObject(node) && node.kind === Ast.NodeKind.InitializerDecl
// prettier-ignore
export const isStructDeclNode = (node: unknown): node is Ast.StructDeclNode => isNodeObject(node) && node.kind === Ast.NodeKind.StructDecl
// prettier-ignore
export const isTypeAliasDeclNode = (node: unknown): node is Ast.TypeAliasDeclNode => isNodeObject(node) && node.kind === Ast.NodeKind.TypeAliasDecl
// prettier-ignore
export const isVariableDeclNode = (node: unknown): node is Ast.VariableDeclNode => isNodeObject(node) && node.kind === Ast.NodeKind.VariableDecl
//#endregion

//#region Expressions
// prettier-ignore
export const isArrayExprNode = (node: unknown): node is Ast.ArrayExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.ArrayExpr
// prettier-ignore
export const isAssignmentExprNode = (node: unknown): node is Ast.AssignmentExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.AssignmentExpr
// prettier-ignore
export const isBinaryOperatorExprNode = (node: unknown): node is Ast.BinaryOperatorExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.BinaryOperatorExpr
// prettier-ignore
export const isBooleanLiteralExprNode = (node: unknown): node is Ast.BooleanLiteralExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.BooleanLiteralExpr
// prettier-ignore
export const isDeclReferenceExprNode = (node: unknown): node is Ast.DeclReferenceExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.DeclReferenceExpr
// prettier-ignore
export const isFloatLiteralExprNode = (node: unknown): node is Ast.FloatLiteralExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.FloatLiteralExpr
// prettier-ignore
export const isFunctionCallExprNode = (node: unknown): node is Ast.FunctionCallExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.FunctionCallExpr
// prettier-ignore
export const isIfExprNode = (node: unknown): node is Ast.IfExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.IfExpr
// prettier-ignore
export const isInfixOperatorExprNode = (node: unknown): node is Ast.InfixOperatorExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.InfixOperatorExpr
// prettier-ignore
export const isIntegerLiteralExprNode = (node: unknown): node is Ast.IntegerLiteralExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.IntegerLiteralExpr
// prettier-ignore
export const isMemberAccessExprNode = (node: unknown): node is Ast.MemberAccessExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.MemberAccessExpr
// prettier-ignore
export const isNilLiteralExprNode = (node: unknown): node is Ast.NilLiteralExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.NilLiteralExpr
// prettier-ignore
export const isStringLiteralExprNode = (node: unknown): node is Ast.StringLiteralExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.StringLiteralExpr
// prettier-ignore
export const isSwitchExprNode = (node: unknown): node is Ast.SwitchExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.SwitchExpr
// prettier-ignore
export const isTryExprNode = (node: unknown): node is Ast.TryExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.TryExpr
// prettier-ignore
export const isTupleExprNode = (node: unknown): node is Ast.TupleExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.TupleExpr
//#endregion

//#region Patterns
// prettier-ignore
export const isExpressionPatternNode = (node: unknown): node is Ast.ExpressionPatternNode => isNodeObject(node) && node.kind === Ast.NodeKind.ExpressionPattern
// prettier-ignore
export const isIdentifierPatternNode = (node: unknown): node is Ast.IdentifierPatternNode => isNodeObject(node) && node.kind === Ast.NodeKind.IdentifierPattern
//#endregion

//#region Statements
// prettier-ignore
export const isExpressionStmtNode = (node: unknown): node is Ast.ExpressionStmtNode => isNodeObject(node) && node.kind === Ast.NodeKind.ExpressionStmt
// prettier-ignore
export const isThrowStmtNode = (node: unknown): node is Ast.ThrowStmtNode => isNodeObject(node) && node.kind === Ast.NodeKind.ThrowStmt
//#endregion

//#region Types
// prettier-ignore
export const isArrayTypeNode = (node: unknown): node is Ast.ArrayTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.ArrayType
// prettier-ignore
export const isCompositionTypeNode = (node: unknown): node is Ast.CompositionTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.CompositionType
// prettier-ignore
export const isDictionaryTypeNode = (node: unknown): node is Ast.DictionaryTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.DictionaryType
// prettier-ignore
export const isIdentifierTypeNode = (node: unknown): node is Ast.IdentifierTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.IdentifierType
// prettier-ignore
export const isOptionalTypeNode = (node: unknown): node is Ast.OptionalTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.OptionalType
// prettier-ignore
export const isSomeOrAnyTypeNode = (node: unknown): node is Ast.SomeOrAnyTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.SomeOrAnyType
// prettier-ignore
export const isTupleTypeNode = (node: unknown): node is Ast.TupleTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.TupleType
//#endregion

//#region Collections
// prettier-ignore
export const isArrayElementListNode = (node: unknown): node is Ast.ArrayElementListNode => isNodeObject(node) && node.kind === Ast.NodeKind.ArrayElementList
// prettier-ignore
export const isArrayElementNode = (node: unknown): node is Ast.ArrayElementNode => isNodeObject(node) && node.kind === Ast.NodeKind.ArrayElement
// prettier-ignore
export const isAvailabilityArgumentListNode = (node: unknown): node is Ast.AvailabilityArgumentListNode => isNodeObject(node) && node.kind === Ast.NodeKind.AvailabilityArgumentList
// prettier-ignore
export const isAvailabilityArgumentNode = (node: unknown): node is Ast.AvailabilityArgumentNode => isNodeObject(node) && node.kind === Ast.NodeKind.AvailabilityArgument
// prettier-ignore
export const isCodeBlockItemListNode = (node: unknown): node is Ast.CodeBlockItemListNode => isNodeObject(node) && node.kind === Ast.NodeKind.CodeBlockItemList
// prettier-ignore
export const isCodeBlockItemNode = (node: unknown): node is Ast.CodeBlockItemNode => isNodeObject(node) && node.kind === Ast.NodeKind.CodeBlockItem
// prettier-ignore
export const isCompositionTypeElementListNode = (node: unknown): node is Ast.CompositionTypeElementListNode => isNodeObject(node) && node.kind === Ast.NodeKind.CompositionTypeElementList
// prettier-ignore
export const isCompositionTypeElementNode = (node: unknown): node is Ast.CompositionTypeElementNode => isNodeObject(node) && node.kind === Ast.NodeKind.CompositionTypeElement
// prettier-ignore
export const isConditionElementListNode = (node: unknown): node is Ast.ConditionElementListNode => isNodeObject(node) && node.kind === Ast.NodeKind.ConditionElementList
// prettier-ignore
export const isConditionElementNode = (node: unknown): node is Ast.ConditionElementNode => isNodeObject(node) && node.kind === Ast.NodeKind.ConditionElement
// prettier-ignore
export const isDeclModifierListNode = (node: unknown): node is Ast.DeclModifierListNode => isNodeObject(node) && node.kind === Ast.NodeKind.DeclModifierList
// prettier-ignore
export const isDeclModifierNode = (node: unknown): node is Ast.DeclModifierNode => isNodeObject(node) && node.kind === Ast.NodeKind.DeclModifier
// prettier-ignore
export const isDeclNameArgumentListNode = (node: unknown): node is Ast.DeclNameArgumentListNode => isNodeObject(node) && node.kind === Ast.NodeKind.DeclNameArgumentList
// prettier-ignore
export const isDeclNameArgumentNode = (node: unknown): node is Ast.DeclNameArgumentNode => isNodeObject(node) && node.kind === Ast.NodeKind.DeclNameArgument
// prettier-ignore
export const isEnumCaseElementListNode = (node: unknown): node is Ast.EnumCaseElementListNode => isNodeObject(node) && node.kind === Ast.NodeKind.EnumCaseElementList
// prettier-ignore
export const isEnumCaseElementNode = (node: unknown): node is Ast.EnumCaseElementNode => isNodeObject(node) && node.kind === Ast.NodeKind.EnumCaseElement
// prettier-ignore
export const isEnumCaseParameterListNode = (node: unknown): node is Ast.EnumCaseParameterListNode => isNodeObject(node) && node.kind === Ast.NodeKind.EnumCaseParameterList
// prettier-ignore
export const isEnumCaseParameterNode = (node: unknown): node is Ast.EnumCaseParameterNode => isNodeObject(node) && node.kind === Ast.NodeKind.EnumCaseParameter
// prettier-ignore
export const isFunctionParameterListNode = (node: unknown): node is Ast.FunctionParameterListNode => isNodeObject(node) && node.kind === Ast.NodeKind.FunctionParameterList
// prettier-ignore
export const isFunctionParameterNode = (node: unknown): node is Ast.FunctionParameterNode => isNodeObject(node) && node.kind === Ast.NodeKind.FunctionParameter
// prettier-ignore
export const isGenericArgumentListNode = (node: unknown): node is Ast.GenericArgumentListNode => isNodeObject(node) && node.kind === Ast.NodeKind.GenericArgumentList
// prettier-ignore
export const isGenericArgumentNode = (node: unknown): node is Ast.GenericArgumentNode => isNodeObject(node) && node.kind === Ast.NodeKind.GenericArgument
// prettier-ignore
export const isGenericParameterListNode = (node: unknown): node is Ast.GenericParameterListNode => isNodeObject(node) && node.kind === Ast.NodeKind.GenericParameterList
// prettier-ignore
export const isGenericParameterNode = (node: unknown): node is Ast.GenericParameterNode => isNodeObject(node) && node.kind === Ast.NodeKind.GenericParameter
// prettier-ignore
export const isInheritanceTypeListNode = (node: unknown): node is Ast.InheritanceTypeListNode => isNodeObject(node) && node.kind === Ast.NodeKind.InheritanceTypeList
// prettier-ignore
export const isInheritanceTypeNode = (node: unknown): node is Ast.InheritanceTypeNode => isNodeObject(node) && node.kind === Ast.NodeKind.InheritanceType
// prettier-ignore
export const isLabeledExprListNode = (node: unknown): node is Ast.LabeledExprListNode => isNodeObject(node) && node.kind === Ast.NodeKind.LabeledExprList
// prettier-ignore
export const isLabeledExprNode = (node: unknown): node is Ast.LabeledExprNode => isNodeObject(node) && node.kind === Ast.NodeKind.LabeledExpr
// prettier-ignore
export const isMemberBlockItemListNode = (node: unknown): node is Ast.MemberBlockItemListNode => isNodeObject(node) && node.kind === Ast.NodeKind.MemberBlockItemList
// prettier-ignore
export const isMemberBlockItemNode = (node: unknown): node is Ast.MemberBlockItemNode => isNodeObject(node) && node.kind === Ast.NodeKind.MemberBlockItem
// prettier-ignore
export const isPatternBindingListNode = (node: unknown): node is Ast.PatternBindingListNode => isNodeObject(node) && node.kind === Ast.NodeKind.PatternBindingList
// prettier-ignore
export const isPatternBindingNode = (node: unknown): node is Ast.PatternBindingNode => isNodeObject(node) && node.kind === Ast.NodeKind.PatternBinding
// prettier-ignore
export const isSwitchCaseItemListNode = (node: unknown): node is Ast.SwitchCaseItemListNode => isNodeObject(node) && node.kind === Ast.NodeKind.SwitchCaseItemList
// prettier-ignore
export const isSwitchCaseItemNode = (node: unknown): node is Ast.SwitchCaseItemNode => isNodeObject(node) && node.kind === Ast.NodeKind.SwitchCaseItem
// prettier-ignore
export const isSwitchCaseListNode = (node: unknown): node is Ast.SwitchCaseListNode => isNodeObject(node) && node.kind === Ast.NodeKind.SwitchCaseList
// prettier-ignore
export const isSwitchCaseNode = (node: unknown): node is Ast.SwitchCaseNode => isNodeObject(node) && node.kind === Ast.NodeKind.SwitchCase
// prettier-ignore
export const isTupleTypeElementListNode = (node: unknown): node is Ast.TupleTypeElementListNode => isNodeObject(node) && node.kind === Ast.NodeKind.TupleTypeElementList
// prettier-ignore
export const isTupleTypeElementNode = (node: unknown): node is Ast.TupleTypeElementNode => isNodeObject(node) && node.kind === Ast.NodeKind.TupleTypeElement
//#endregion

//#region Attributes
// prettier-ignore
export const isAttributeListNode = (node: unknown): node is Ast.AttributeListNode => isNodeObject(node) && node.kind === Ast.NodeKind.AttributeList
// prettier-ignore
export const isAttributeNode = (node: unknown): node is Ast.AttributeNode => isNodeObject(node) && node.kind === Ast.NodeKind.Attribute
//#endregion

//#region Miscellaneous Nodes
// prettier-ignore
export const isAvailabilityLabeledArgumentNode = (node: unknown): node is Ast.AvailabilityLabeledArgumentNode => isNodeObject(node) && node.kind === Ast.NodeKind.AvailabilityLabeledArgument
// prettier-ignore
export const isAvailabilityTokenArgumentNode = (node: unknown): node is Ast.AvailabilityTokenArgumentNode => isNodeObject(node) && node.kind === Ast.NodeKind.AvailabilityTokenArgument
// prettier-ignore
export const isCodeBlockNode = (node: unknown): node is Ast.CodeBlockNode => isNodeObject(node) && node.kind === Ast.NodeKind.CodeBlock
// prettier-ignore
export const isDeclNameArgumentsNode = (node: unknown): node is Ast.DeclNameArgumentsNode => isNodeObject(node) && node.kind === Ast.NodeKind.DeclNameArguments
// prettier-ignore
export const isEnumCaseParameterClauseNode = (node: unknown): node is Ast.EnumCaseParameterClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.EnumCaseParameterClause
// prettier-ignore
export const isFunctionEffectSpecifiersNode = (node: unknown): node is Ast.FunctionEffectSpecifiersNode => isNodeObject(node) && node.kind === Ast.NodeKind.FunctionEffectSpecifiers
// prettier-ignore
export const isFunctionParameterClauseNode = (node: unknown): node is Ast.FunctionParameterClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.FunctionParameterClause
// prettier-ignore
export const isFunctionSignatureNode = (node: unknown): node is Ast.FunctionSignatureNode => isNodeObject(node) && node.kind === Ast.NodeKind.FunctionSignature
// prettier-ignore
export const isGenericArgumentClauseNode = (node: unknown): node is Ast.GenericArgumentClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.GenericArgumentClause
// prettier-ignore
export const isGenericParameterClauseNode = (node: unknown): node is Ast.GenericParameterClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.GenericParameterClause
// prettier-ignore
export const isInheritanceClauseNode = (node: unknown): node is Ast.InheritanceClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.InheritanceClause
// prettier-ignore
export const isInitializerClauseNode = (node: unknown): node is Ast.InitializerClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.InitializerClause
// prettier-ignore
export const isMemberBlockNode = (node: unknown): node is Ast.MemberBlockNode => isNodeObject(node) && node.kind === Ast.NodeKind.MemberBlock
// prettier-ignore
export const isOptionalBindingConditionNode = (node: unknown): node is Ast.OptionalBindingConditionNode => isNodeObject(node) && node.kind === Ast.NodeKind.OptionalBindingCondition
// prettier-ignore
export const isReturnClauseNode = (node: unknown): node is Ast.ReturnClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.ReturnClause
// prettier-ignore
export const isSwitchCaseLabelNode = (node: unknown): node is Ast.SwitchCaseLabelNode => isNodeObject(node) && node.kind === Ast.NodeKind.SwitchCaseLabel
// prettier-ignore
export const isSwitchDefaultLabelNode = (node: unknown): node is Ast.SwitchDefaultLabelNode => isNodeObject(node) && node.kind === Ast.NodeKind.SwitchDefaultLabel
// prettier-ignore
export const isThrowsClauseNode = (node: unknown): node is Ast.ThrowsClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.ThrowsClause
// prettier-ignore
export const isTypeAnnotationNode = (node: unknown): node is Ast.TypeAnnotationNode => isNodeObject(node) && node.kind === Ast.NodeKind.TypeAnnotation
// prettier-ignore
export const isTypeInitializerClauseNode = (node: unknown): node is Ast.TypeInitializerClauseNode => isNodeObject(node) && node.kind === Ast.NodeKind.TypeInitializerClause
//#endregion
