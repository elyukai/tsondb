import { assertExhaustive } from "../../../shared/utils/typeSafety.ts"
import { cleanupUndefinedKeys } from "./ast/creators.ts"
import * as Ast from "./ast/types.ts"

const walkEnumCaseDeclNode = (
  node: Ast.EnumCaseDeclNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.EnumCaseDeclNode =>
  cleanupUndefinedKeys({
    ...node,
    attributes: node.attributes && fn(node.attributes),
    modifiers: node.modifiers && fn(node.modifiers),
    elements: fn(node.elements),
  })

const walkEnumDeclNode = (
  node: Ast.EnumDeclNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.EnumDeclNode =>
  cleanupUndefinedKeys({
    ...node,
    attributes: node.attributes && fn(node.attributes),
    modifiers: node.modifiers && fn(node.modifiers),
    genericParameterClause: node.genericParameterClause && fn(node.genericParameterClause),
    inheritanceClause: node.inheritanceClause && fn(node.inheritanceClause),
    memberBlock: fn(node.memberBlock),
  })

const walkInitializerDeclNode = (
  node: Ast.InitializerDeclNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.InitializerDeclNode =>
  cleanupUndefinedKeys({
    ...node,
    attributes: node.attributes && fn(node.attributes),
    modifiers: node.modifiers && fn(node.modifiers),
    genericParameterClause: node.genericParameterClause && fn(node.genericParameterClause),
    signature: fn(node.signature),
    body: fn(node.body),
  })

const walkStructDeclNode = (
  node: Ast.StructDeclNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.StructDeclNode =>
  cleanupUndefinedKeys({
    ...node,
    attributes: node.attributes && fn(node.attributes),
    modifiers: node.modifiers && fn(node.modifiers),
    genericParameterClause: node.genericParameterClause && fn(node.genericParameterClause),
    inheritanceClause: node.inheritanceClause && fn(node.inheritanceClause),
    memberBlock: fn(node.memberBlock),
  })

const walkTypeAliasDeclNode = (
  node: Ast.TypeAliasDeclNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TypeAliasDeclNode =>
  cleanupUndefinedKeys({
    ...node,
    attributes: node.attributes && fn(node.attributes),
    modifiers: node.modifiers && fn(node.modifiers),
    genericParameterClause: node.genericParameterClause && fn(node.genericParameterClause),
    initializer: fn(node.initializer),
  })

const walkVariableDeclNode = (
  node: Ast.VariableDeclNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.VariableDeclNode =>
  cleanupUndefinedKeys({
    ...node,
    attributes: node.attributes && fn(node.attributes),
    modifiers: node.modifiers && fn(node.modifiers),
    bindings: fn(node.bindings),
  })

const walkArrayExprNode = (
  node: Ast.ArrayExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ArrayExprNode => ({ ...node, elements: fn(node.elements) })

const walkAssignmentExprNode = (
  node: Ast.AssignmentExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.AssignmentExprNode => node

const walkBinaryOperatorExprNode = (
  node: Ast.BinaryOperatorExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.BinaryOperatorExprNode => node

const walkBooleanLiteralExprNode = (
  node: Ast.BooleanLiteralExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.BooleanLiteralExprNode => node

const walkDeclReferenceExprNode = (
  node: Ast.DeclReferenceExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.DeclReferenceExprNode => node

const walkFloatLiteralExprNode = (
  node: Ast.FloatLiteralExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.FloatLiteralExprNode => node

const walkIfExprNode = (
  node: Ast.IfExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.IfExprNode =>
  cleanupUndefinedKeys({
    ...node,
    conditions: fn(node.conditions),
    body: fn(node.body),
    elseBody: node.elseBody && fn(node.elseBody),
  })

const walkInfixOperatorExprNode = (
  node: Ast.InfixOperatorExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.InfixOperatorExprNode => ({
  ...node,
  leftOperand: fn(node.leftOperand),
  operator: fn(node.operator),
  rightOperand: fn(node.rightOperand),
})

const walkIntegerLiteralExprNode = (
  node: Ast.IntegerLiteralExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.IntegerLiteralExprNode => node

const walkMemberAccessExprNode = (
  node: Ast.MemberAccessExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.MemberAccessExprNode =>
  cleanupUndefinedKeys({
    ...node,
    base: node.base && fn(node.base),
    declName: fn(node.declName),
  })

const walkNilLiteralExprNode = (
  node: Ast.NilLiteralExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.NilLiteralExprNode => node

const walkStringLiteralExprNode = (
  node: Ast.StringLiteralExprNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.StringLiteralExprNode => node

const walkSwitchExprNode = (
  node: Ast.SwitchExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.SwitchExprNode =>
  cleanupUndefinedKeys({
    ...node,
    subject: fn(node.subject),
    cases: fn(node.cases),
  })

const walkTryExprNode = (
  node: Ast.TryExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TryExprNode =>
  cleanupUndefinedKeys({
    ...node,
    expression: fn(node.expression),
  })

const walkTupleExprNode = (
  node: Ast.TupleExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TupleExprNode =>
  cleanupUndefinedKeys({
    ...node,
    elements: fn(node.elements),
  })

const walkExpressionPatternNode = (
  node: Ast.ExpressionPatternNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ExpressionPatternNode => ({ ...node, expression: fn(node.expression) })

const walkIdentifierPatternNode = (
  node: Ast.IdentifierPatternNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.IdentifierPatternNode => node

const walkExpressionStmtNode = (
  node: Ast.ExpressionStmtNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ExpressionStmtNode => ({ ...node, expression: fn(node.expression) })

const walkThrowStmtNode = (
  node: Ast.ThrowStmtNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ThrowStmtNode => ({ ...node, expression: fn(node.expression) })

const walkArrayTypeNode = (
  node: Ast.ArrayTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ArrayTypeNode => ({ ...node, element: fn(node.element) })

const walkCompositionTypeNode = (
  node: Ast.CompositionTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.CompositionTypeNode => ({ ...node, elements: fn(node.elements) })

const walkDictionaryTypeNode = (
  node: Ast.DictionaryTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.DictionaryTypeNode => ({
  ...node,
  key: fn(node.key),
  value: fn(node.value),
})

const walkIdentifierTypeNode = (
  node: Ast.IdentifierTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.IdentifierTypeNode =>
  cleanupUndefinedKeys({
    ...node,
    genericArgumentClause: node.genericArgumentClause && fn(node.genericArgumentClause),
  })

const walkOptionalTypeNode = (
  node: Ast.OptionalTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.OptionalTypeNode => ({ ...node, wrappedType: fn(node.wrappedType) })

const walkSomeOrAnyTypeNode = (
  node: Ast.SomeOrAnyTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.SomeOrAnyTypeNode => ({ ...node, constraint: fn(node.constraint) })

const walkTupleTypeNode = (
  node: Ast.TupleTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TupleTypeNode => ({ ...node, elements: fn(node.elements) })

const walkArrayElementListNode = (
  node: Ast.ArrayElementListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ArrayElementListNode => ({ ...node, elements: node.elements.map(fn) })

const walkArrayElementNode = (
  node: Ast.ArrayElementNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ArrayElementNode => ({ ...node, expression: fn(node.expression) })

const walkAvailabilityArgumentListNode = (
  node: Ast.AvailabilityArgumentListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.AvailabilityArgumentListNode => ({
  ...node,
  arguments: node.arguments.map(fn),
})

const walkAvailabilityArgumentNode = (
  node: Ast.AvailabilityArgumentNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.AvailabilityArgumentNode => ({ ...node, argument: fn(node.argument) })

const walkCodeBlockItemListNode = (
  node: Ast.CodeBlockItemListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.CodeBlockItemListNode => ({ ...node, items: node.items.map(fn) })

const walkCodeBlockItemNode = (
  node: Ast.CodeBlockItemNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.CodeBlockItemNode => ({ ...node, item: fn(node.item) })

const walkCompositionTypeElementListNode = (
  node: Ast.CompositionTypeElementListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.CompositionTypeElementListNode => ({
  ...node,
  elements: node.elements.map(fn),
})

const walkCompositionTypeElementNode = (
  node: Ast.CompositionTypeElementNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.CompositionTypeElementNode => ({ ...node, type: fn(node.type) })

const walkConditionElementListNode = (
  node: Ast.ConditionElementListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ConditionElementListNode => ({
  ...node,
  elements: node.elements.map(fn),
})

const walkConditionElementNode = (
  node: Ast.ConditionElementNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ConditionElementNode => ({ ...node, type: fn(node.type) })

const walkDeclModifierListNode = (
  node: Ast.DeclModifierListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.DeclModifierListNode => ({ ...node, modifiers: node.modifiers.map(fn) })

const walkDeclModifierNode = (
  node: Ast.DeclModifierNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.DeclModifierNode => node

const walkDeclNameArgumentListNode = (
  node: Ast.DeclNameArgumentListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.DeclNameArgumentListNode => ({
  ...node,
  arguments: node.arguments.map(fn),
})

const walkDeclNameArgumentNode = (
  node: Ast.DeclNameArgumentNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.DeclNameArgumentNode => node

const walkEnumCaseElementListNode = (
  node: Ast.EnumCaseElementListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.EnumCaseElementListNode => ({ ...node, elements: node.elements.map(fn) })

const walkEnumCaseElementNode = (
  node: Ast.EnumCaseElementNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.EnumCaseElementNode =>
  cleanupUndefinedKeys({
    ...node,
    parameterClause: node.parameterClause && fn(node.parameterClause),
    rawValue: node.rawValue && fn(node.rawValue),
  })

const walkEnumCaseParameterListNode = (
  node: Ast.EnumCaseParameterListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.EnumCaseParameterListNode => ({
  ...node,
  parameters: node.parameters.map(fn),
})

const walkEnumCaseParameterNode = (
  node: Ast.EnumCaseParameterNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.EnumCaseParameterNode => ({ ...node, type: fn(node.type) })

const walkFunctionParameterListNode = (
  node: Ast.FunctionParameterListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.FunctionParameterListNode => ({
  ...node,
  parameters: node.parameters.map(fn),
})

const walkFunctionParameterNode = (
  node: Ast.FunctionParameterNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.FunctionParameterNode =>
  cleanupUndefinedKeys({
    ...node,
    attributes: node.attributes && fn(node.attributes),
    modifiers: node.modifiers && fn(node.modifiers),
    type: fn(node.type),
    defaultValue: node.defaultValue && fn(node.defaultValue),
  })

const walkGenericArgumentListNode = (
  node: Ast.GenericArgumentListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.GenericArgumentListNode => ({
  ...node,
  arguments: node.arguments.map(fn),
})

const walkGenericArgumentNode = (
  node: Ast.GenericArgumentNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.GenericArgumentNode => ({ ...node, argument: fn(node.argument) })

const walkGenericParameterListNode = (
  node: Ast.GenericParameterListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.GenericParameterListNode => ({
  ...node,
  parameters: node.parameters.map(fn),
})

const walkGenericParameterNode = (
  node: Ast.GenericParameterNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.GenericParameterNode =>
  cleanupUndefinedKeys({
    ...node,
    inheritedType: node.inheritedType && fn(node.inheritedType),
  })

const walkInheritanceTypeListNode = (
  node: Ast.InheritanceTypeListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.InheritanceTypeListNode => ({ ...node, types: node.types.map(fn) })

const walkInheritanceTypeNode = (
  node: Ast.InheritanceTypeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.InheritanceTypeNode => ({ ...node, type: fn(node.type) })

const walkLabeledExprListNode = (
  node: Ast.LabeledExprListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.LabeledExprListNode => ({
  ...node,
  expressions: node.expressions.map(fn),
})

const walkLabeledExprNode = (
  node: Ast.LabeledExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.LabeledExprNode => ({ ...node, expression: fn(node.expression) })

const walkMemberBlockItemListNode = (
  node: Ast.MemberBlockItemListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.MemberBlockItemListNode => ({ ...node, items: node.items.map(fn) })

const walkMemberBlockItemNode = (
  node: Ast.MemberBlockItemNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.MemberBlockItemNode => ({ ...node, decl: fn(node.decl) })

const walkPatternBindingListNode = (
  node: Ast.PatternBindingListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.PatternBindingListNode => ({ ...node, bindings: node.bindings.map(fn) })

const walkPatternBindingNode = (
  node: Ast.PatternBindingNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.PatternBindingNode =>
  cleanupUndefinedKeys({
    ...node,
    pattern: fn(node.pattern),
    typeAnnotation: node.typeAnnotation && fn(node.typeAnnotation),
    initializer: node.initializer && fn(node.initializer),
  })

const walkSwitchCaseItemListNode = (
  node: Ast.SwitchCaseItemListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.SwitchCaseItemListNode => ({
  ...node,
  items: node.items.map(fn),
})

const walkSwitchCaseItemNode = (
  node: Ast.SwitchCaseItemNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.SwitchCaseItemNode => ({ ...node, pattern: fn(node.pattern) })

const walkSwitchCaseListNode = (
  node: Ast.SwitchCaseListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.SwitchCaseListNode => ({
  ...node,
  cases: node.cases.map(fn),
})

const walkSwitchCaseNode = (
  node: Ast.SwitchCaseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.SwitchCaseNode =>
  cleanupUndefinedKeys({
    ...node,
    attribute: node.attribute && fn(node.attribute),
    label: fn(node.label),
    statements: fn(node.statements),
  })

const walkTupleTypeElementListNode = (
  node: Ast.TupleTypeElementListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TupleTypeElementListNode => ({
  ...node,
  elements: node.elements.map(fn),
})

const walkTupleTypeElementNode = (
  node: Ast.TupleTypeElementNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TupleTypeElementNode => ({ ...node, type: fn(node.type) })

const walkAttributeListNode = (
  node: Ast.AttributeListNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.AttributeListNode => ({ ...node, attributes: node.attributes.map(fn) })

const walkAttributeNode = (
  node: Ast.AttributeNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.AttributeNode => ({
  ...node,
  attributeName: fn(node.attributeName),
  arguments: fn(node.arguments),
})

const walkAvailabilityLabeledArgumentNode = (
  node: Ast.AvailabilityLabeledArgumentNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.AvailabilityLabeledArgumentNode => node

const walkAvailabilityTokenArgumentNode = (
  node: Ast.AvailabilityTokenArgumentNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.AvailabilityTokenArgumentNode => node

const walkCodeBlockNode = (
  node: Ast.CodeBlockNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.CodeBlockNode => ({ ...node, statements: fn(node.statements) })

const walkDeclNameArgumentsNode = (
  node: Ast.DeclNameArgumentsNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.DeclNameArgumentsNode => ({ ...node, arguments: fn(node.arguments) })

const walkEnumCaseParameterClauseNode = (
  node: Ast.EnumCaseParameterClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.EnumCaseParameterClauseNode => ({
  ...node,
  parameters: fn(node.parameters),
})

const walkFunctionCallExprNode = (
  node: Ast.FunctionCallExprNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.FunctionCallExprNode => ({
  ...node,
  calledExpression: fn(node.calledExpression),
  arguments: fn(node.arguments),
})

const walkFunctionEffectSpecifiersNode = (
  node: Ast.FunctionEffectSpecifiersNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.FunctionEffectSpecifiersNode => ({
  ...node,
  throwsClause: node.throwsClause && fn(node.throwsClause),
})

const walkFunctionParameterClauseNode = (
  node: Ast.FunctionParameterClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.FunctionParameterClauseNode => ({
  ...node,
  parameters: fn(node.parameters),
})

const walkFunctionSignatureNode = (
  node: Ast.FunctionSignatureNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.FunctionSignatureNode => ({
  ...node,
  parameterClause: fn(node.parameterClause),
  effectSpecifiers: node.effectSpecifiers && fn(node.effectSpecifiers),
  returnClause: node.returnClause && fn(node.returnClause),
})

const walkGenericArgumentClauseNode = (
  node: Ast.GenericArgumentClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.GenericArgumentClauseNode => ({ ...node, arguments: fn(node.arguments) })

const walkGenericParameterClauseNode = (
  node: Ast.GenericParameterClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.GenericParameterClauseNode => ({
  ...node,
  parameters: fn(node.parameters),
})

const walkInheritanceClauseNode = (
  node: Ast.InheritanceClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.InheritanceClauseNode => ({
  ...node,
  inheritedTypes: fn(node.inheritedTypes),
})

const walkInitializerClauseNode = (
  node: Ast.InitializerClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.InitializerClauseNode => ({ ...node, value: fn(node.value) })

const walkMemberBlockNode = (
  node: Ast.MemberBlockNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.MemberBlockNode => ({ ...node, members: fn(node.members) })

const walkOptionalBindingConditionNode = (
  node: Ast.OptionalBindingConditionNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.OptionalBindingConditionNode =>
  cleanupUndefinedKeys({
    ...node,
    pattern: fn(node.pattern),
    typeAnnotation: node.typeAnnotation && fn(node.typeAnnotation),
    initializer: node.initializer && fn(node.initializer),
  })

const walkReturnClauseNode = (
  node: Ast.ReturnClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ReturnClauseNode => ({ ...node, type: fn(node.type) })

const walkSwitchCaseLabelNode = (
  node: Ast.SwitchCaseLabelNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.SwitchCaseLabelNode => ({ ...node, caseItems: fn(node.caseItems) })

const walkSwitchDefaultLabelNode = (
  node: Ast.SwitchDefaultLabelNode,
  _fn: <T extends Ast.Node>(node: T) => T,
): Ast.SwitchDefaultLabelNode => node

const walkThrowsClauseNode = (
  node: Ast.ThrowsClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.ThrowsClauseNode => ({ ...node, type: node.type && fn(node.type) })

const walkTypeAnnotationNode = (
  node: Ast.TypeAnnotationNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TypeAnnotationNode => ({ ...node, type: fn(node.type) })

const walkTypeInitializerClauseNode = (
  node: Ast.TypeInitializerClauseNode,
  fn: <T extends Ast.Node>(node: T) => T,
): Ast.TypeInitializerClauseNode => ({ ...node, value: fn(node.value) })

export const walk = (ast: Ast.AstRoot, fn: <T extends Ast.Node>(node: T) => T): Ast.AstRoot => {
  const walkSingleNode = <T extends Ast.Node>(node: T): T => {
    switch (node.kind) {
      case Ast.NodeKind.EnumCaseDecl:
        return fn(walkEnumCaseDeclNode(node, fn) as T)
      case Ast.NodeKind.EnumDecl:
        return fn(walkEnumDeclNode(node, fn) as T)
      case Ast.NodeKind.InitializerDecl:
        return fn(walkInitializerDeclNode(node, fn) as T)
      case Ast.NodeKind.StructDecl:
        return fn(walkStructDeclNode(node, fn) as T)
      case Ast.NodeKind.TypeAliasDecl:
        return fn(walkTypeAliasDeclNode(node, fn) as T)
      case Ast.NodeKind.VariableDecl:
        return fn(walkVariableDeclNode(node, fn) as T)

      case Ast.NodeKind.ArrayExpr:
        return fn(walkArrayExprNode(node, fn) as T)
      case Ast.NodeKind.AssignmentExpr:
        return fn(walkAssignmentExprNode(node, fn) as T)
      case Ast.NodeKind.BinaryOperatorExpr:
        return fn(walkBinaryOperatorExprNode(node, fn) as T)
      case Ast.NodeKind.BooleanLiteralExpr:
        return fn(walkBooleanLiteralExprNode(node, fn) as T)
      case Ast.NodeKind.DeclReferenceExpr:
        return fn(walkDeclReferenceExprNode(node, fn) as T)
      case Ast.NodeKind.FloatLiteralExpr:
        return fn(walkFloatLiteralExprNode(node, fn) as T)
      case Ast.NodeKind.IfExpr:
        return fn(walkIfExprNode(node, fn) as T)
      case Ast.NodeKind.InfixOperatorExpr:
        return fn(walkInfixOperatorExprNode(node, fn) as T)
      case Ast.NodeKind.IntegerLiteralExpr:
        return fn(walkIntegerLiteralExprNode(node, fn) as T)
      case Ast.NodeKind.MemberAccessExpr:
        return fn(walkMemberAccessExprNode(node, fn) as T)
      case Ast.NodeKind.NilLiteralExpr:
        return fn(walkNilLiteralExprNode(node, fn) as T)
      case Ast.NodeKind.StringLiteralExpr:
        return fn(walkStringLiteralExprNode(node, fn) as T)
      case Ast.NodeKind.SwitchExpr:
        return fn(walkSwitchExprNode(node, fn) as T)
      case Ast.NodeKind.TryExpr:
        return fn(walkTryExprNode(node, fn) as T)
      case Ast.NodeKind.TupleExpr:
        return fn(walkTupleExprNode(node, fn) as T)

      case Ast.NodeKind.ExpressionPattern:
        return fn(walkExpressionPatternNode(node, fn) as T)
      case Ast.NodeKind.IdentifierPattern:
        return fn(walkIdentifierPatternNode(node, fn) as T)

      case Ast.NodeKind.ExpressionStmt:
        return fn(walkExpressionStmtNode(node, fn) as T)
      case Ast.NodeKind.ThrowStmt:
        return fn(walkThrowStmtNode(node, fn) as T)

      case Ast.NodeKind.ArrayType:
        return fn(walkArrayTypeNode(node, fn) as T)
      case Ast.NodeKind.CompositionType:
        return fn(walkCompositionTypeNode(node, fn) as T)
      case Ast.NodeKind.DictionaryType:
        return fn(walkDictionaryTypeNode(node, fn) as T)
      case Ast.NodeKind.IdentifierType:
        return fn(walkIdentifierTypeNode(node, fn) as T)
      case Ast.NodeKind.OptionalType:
        return fn(walkOptionalTypeNode(node, fn) as T)
      case Ast.NodeKind.SomeOrAnyType:
        return fn(walkSomeOrAnyTypeNode(node, fn) as T)
      case Ast.NodeKind.TupleType:
        return fn(walkTupleTypeNode(node, fn) as T)

      case Ast.NodeKind.ArrayElementList:
        return fn(walkArrayElementListNode(node, fn) as T)
      case Ast.NodeKind.ArrayElement:
        return fn(walkArrayElementNode(node, fn) as T)
      case Ast.NodeKind.AvailabilityArgumentList:
        return fn(walkAvailabilityArgumentListNode(node, fn) as T)
      case Ast.NodeKind.AvailabilityArgument:
        return fn(walkAvailabilityArgumentNode(node, fn) as T)
      case Ast.NodeKind.CodeBlockItemList:
        return fn(walkCodeBlockItemListNode(node, fn) as T)
      case Ast.NodeKind.CodeBlockItem:
        return fn(walkCodeBlockItemNode(node, fn) as T)
      case Ast.NodeKind.CompositionTypeElementList:
        return fn(walkCompositionTypeElementListNode(node, fn) as T)
      case Ast.NodeKind.CompositionTypeElement:
        return fn(walkCompositionTypeElementNode(node, fn) as T)
      case Ast.NodeKind.ConditionElementList:
        return fn(walkConditionElementListNode(node, fn) as T)
      case Ast.NodeKind.ConditionElement:
        return fn(walkConditionElementNode(node, fn) as T)
      case Ast.NodeKind.DeclModifierList:
        return fn(walkDeclModifierListNode(node, fn) as T)
      case Ast.NodeKind.DeclModifier:
        return fn(walkDeclModifierNode(node, fn) as T)
      case Ast.NodeKind.DeclNameArgumentList:
        return fn(walkDeclNameArgumentListNode(node, fn) as T)
      case Ast.NodeKind.DeclNameArgument:
        return fn(walkDeclNameArgumentNode(node, fn) as T)
      case Ast.NodeKind.EnumCaseElementList:
        return fn(walkEnumCaseElementListNode(node, fn) as T)
      case Ast.NodeKind.EnumCaseElement:
        return fn(walkEnumCaseElementNode(node, fn) as T)
      case Ast.NodeKind.EnumCaseParameterList:
        return fn(walkEnumCaseParameterListNode(node, fn) as T)
      case Ast.NodeKind.EnumCaseParameter:
        return fn(walkEnumCaseParameterNode(node, fn) as T)
      case Ast.NodeKind.FunctionParameterList:
        return fn(walkFunctionParameterListNode(node, fn) as T)
      case Ast.NodeKind.FunctionParameter:
        return fn(walkFunctionParameterNode(node, fn) as T)
      case Ast.NodeKind.GenericArgumentList:
        return fn(walkGenericArgumentListNode(node, fn) as T)
      case Ast.NodeKind.GenericArgument:
        return fn(walkGenericArgumentNode(node, fn) as T)
      case Ast.NodeKind.GenericParameterList:
        return fn(walkGenericParameterListNode(node, fn) as T)
      case Ast.NodeKind.GenericParameter:
        return fn(walkGenericParameterNode(node, fn) as T)
      case Ast.NodeKind.InheritanceTypeList:
        return fn(walkInheritanceTypeListNode(node, fn) as T)
      case Ast.NodeKind.InheritanceType:
        return fn(walkInheritanceTypeNode(node, fn) as T)
      case Ast.NodeKind.LabeledExprList:
        return fn(walkLabeledExprListNode(node, fn) as T)
      case Ast.NodeKind.LabeledExpr:
        return fn(walkLabeledExprNode(node, fn) as T)
      case Ast.NodeKind.MemberBlockItemList:
        return fn(walkMemberBlockItemListNode(node, fn) as T)
      case Ast.NodeKind.MemberBlockItem:
        return fn(walkMemberBlockItemNode(node, fn) as T)
      case Ast.NodeKind.PatternBindingList:
        return fn(walkPatternBindingListNode(node, fn) as T)
      case Ast.NodeKind.PatternBinding:
        return fn(walkPatternBindingNode(node, fn) as T)
      case Ast.NodeKind.SwitchCaseItemList:
        return fn(walkSwitchCaseItemListNode(node, fn) as T)
      case Ast.NodeKind.SwitchCaseItem:
        return fn(walkSwitchCaseItemNode(node, fn) as T)
      case Ast.NodeKind.SwitchCaseList:
        return fn(walkSwitchCaseListNode(node, fn) as T)
      case Ast.NodeKind.SwitchCase:
        return fn(walkSwitchCaseNode(node, fn) as T)
      case Ast.NodeKind.TupleTypeElementList:
        return fn(walkTupleTypeElementListNode(node, fn) as T)
      case Ast.NodeKind.TupleTypeElement:
        return fn(walkTupleTypeElementNode(node, fn) as T)

      case Ast.NodeKind.AttributeList:
        return fn(walkAttributeListNode(node, fn) as T)
      case Ast.NodeKind.Attribute:
        return fn(walkAttributeNode(node, fn) as T)

      case Ast.NodeKind.AvailabilityLabeledArgument:
        return fn(walkAvailabilityLabeledArgumentNode(node, fn) as T)
      case Ast.NodeKind.AvailabilityTokenArgument:
        return fn(walkAvailabilityTokenArgumentNode(node, fn) as T)
      case Ast.NodeKind.CodeBlock:
        return fn(walkCodeBlockNode(node, fn) as T)
      case Ast.NodeKind.DeclNameArguments:
        return fn(walkDeclNameArgumentsNode(node, fn) as T)
      case Ast.NodeKind.EnumCaseParameterClause:
        return fn(walkEnumCaseParameterClauseNode(node, fn) as T)
      case Ast.NodeKind.FunctionCallExpr:
        return fn(walkFunctionCallExprNode(node, fn) as T)
      case Ast.NodeKind.FunctionEffectSpecifiers:
        return fn(walkFunctionEffectSpecifiersNode(node, fn) as T)
      case Ast.NodeKind.FunctionParameterClause:
        return fn(walkFunctionParameterClauseNode(node, fn) as T)
      case Ast.NodeKind.FunctionSignature:
        return fn(walkFunctionSignatureNode(node, fn) as T)
      case Ast.NodeKind.GenericArgumentClause:
        return fn(walkGenericArgumentClauseNode(node, fn) as T)
      case Ast.NodeKind.GenericParameterClause:
        return fn(walkGenericParameterClauseNode(node, fn) as T)
      case Ast.NodeKind.InheritanceClause:
        return fn(walkInheritanceClauseNode(node, fn) as T)
      case Ast.NodeKind.InitializerClause:
        return fn(walkInitializerClauseNode(node, fn) as T)
      case Ast.NodeKind.MemberBlock:
        return fn(walkMemberBlockNode(node, fn) as T)
      case Ast.NodeKind.OptionalBindingCondition:
        return fn(walkOptionalBindingConditionNode(node, fn) as T)
      case Ast.NodeKind.ReturnClause:
        return fn(walkReturnClauseNode(node, fn) as T)
      case Ast.NodeKind.SwitchCaseLabel:
        return fn(walkSwitchCaseLabelNode(node, fn) as T)
      case Ast.NodeKind.SwitchDefaultLabel:
        return fn(walkSwitchDefaultLabelNode(node, fn) as T)
      case Ast.NodeKind.ThrowsClause:
        return fn(walkThrowsClauseNode(node, fn) as T)
      case Ast.NodeKind.TypeAnnotation:
        return fn(walkTypeAnnotationNode(node, fn) as T)
      case Ast.NodeKind.TypeInitializerClause:
        return fn(walkTypeInitializerClauseNode(node, fn) as T)

      default:
        return assertExhaustive(node)
    }
  }

  return ast.map(node => walkSingleNode(node))
}
