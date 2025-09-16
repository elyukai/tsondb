import { filterNonNullable } from "@optolith/helpers/array"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import * as SourceAst from "../../ast.js"
import { ignoreNode } from "../../utils/ignoreNode.js"
import {
  arrayExpr,
  arrayType,
  assignmentExpr,
  attribute,
  attributeList,
  availabilityArgumentList,
  availabilityLabeledArgument,
  availabilityTokenArgument,
  binaryOperatorToken,
  codeBlock,
  compositionType,
  compositionTypeElement,
  declModifier,
  declNameArgument,
  declReferenceExpr,
  dictionaryType,
  enumCaseDecl,
  enumCaseElement,
  enumCaseParameter,
  enumDecl,
  expressionPattern,
  expressionStmt,
  floatLiteralExpr,
  functionCallExpr,
  functionEffectSpecifiers,
  functionParameter,
  functionSignature,
  genericArgument,
  genericParameter,
  genericParameterClause,
  identifierPattern,
  identifierToken,
  identifierType,
  ifExpr,
  infixOperatorExpr,
  initializerDecl,
  integerLiteralExpr,
  keywordToken,
  labeledExpr,
  memberAccessExpr,
  nilLiteralExpr,
  optionalBindingCondition,
  optionalType,
  patternBinding,
  postfixQuestionMarkToken,
  someOrAnyType,
  stringLiteralExpr,
  structDecl,
  switchCase,
  switchCaseLabel,
  switchExpr,
  throwsClause,
  throwStmt,
  tryExpr,
  tupleExpr,
  tupleType,
  tupleTypeElement,
  typeAliasDecl,
  variableDecl,
} from "./ast/creators.ts"
import { isCodeBlockNode, isOptionalTypeNode } from "./ast/guards.ts"
import type {
  AttributeListNode,
  AvailabilityArgumentNode_Argument,
  CodeBlockNode,
  DeclModifierNode,
  DeclNode,
  ExprNode,
  GenericParameterClauseNode,
  IfExprNode,
  TypeNode,
} from "./ast/types.ts"
import { Keyword } from "./ast/types.ts"
import { joinTypes } from "./ast/utils.ts"
import type { SwiftOptions } from "./index.ts"

const IGNORE_ENV = "swift"

const accessControlModifier = (options: SwiftOptions): DeclModifierNode[] | undefined =>
  options.defaultPublic === true ? [declModifier(keywordToken(Keyword.public))] : undefined

const deprecatedDocToAttribute = (
  jsDoc: SourceAst.Doc | undefined,
): AttributeListNode | undefined => {
  const deprecated = jsDoc?.tags.deprecated
  return deprecated !== undefined
    ? attributeList([
        attribute(
          identifierType("available"),
          availabilityArgumentList(
            filterNonNullable<AvailabilityArgumentNode_Argument | undefined>([
              availabilityTokenArgument(binaryOperatorToken("*")),
              availabilityTokenArgument(keywordToken(Keyword.deprecated)),
              deprecated.length === 0
                ? undefined
                : availabilityLabeledArgument("message", deprecated),
            ]),
          ),
        ),
      ])
    : undefined
}

const childNodeToTypeNode = (node: SourceAst.ChildNode, options: SwiftOptions): TypeNode => {
  switch (node.kind) {
    case SourceAst.NodeKind.Record:
      throw new Error("Anonymous structs are not supported in Swift")
    case SourceAst.NodeKind.Dictionary:
      return dictionaryType(identifierType("String"), childNodeToTypeNode(node.children, options))
    case SourceAst.NodeKind.Token:
      switch (node.token) {
        case SourceAst.TokenKind.String:
          return identifierType("String")
        case SourceAst.TokenKind.Number:
          return node.jsDoc?.tags.integer === true
            ? identifierType("Int")
            : identifierType("Double")
        case SourceAst.TokenKind.Boolean:
          return identifierType("Bool")
      }
    case SourceAst.NodeKind.Reference:
      return identifierType(
        forcePascal(renderQualifiedName(node.name), options),
        node.typeArguments === undefined
          ? undefined
          : node.typeArguments.map(arg => genericArgument(childNodeToTypeNode(arg, options))),
      )
    case SourceAst.NodeKind.Array:
      return arrayType(childNodeToTypeNode(node.children, options))
    case SourceAst.NodeKind.Union:
      throw new Error("Anonymous union nodes are not supported in Swift")
    case SourceAst.NodeKind.Literal:
      if (typeof node.value === "string") {
        return identifierType("String")
      }
      if (typeof node.value === "number") {
        return Number.isInteger(node.value) ? identifierType("Int") : identifierType("Double")
      }
      if (typeof node.value === "boolean") {
        return identifierType("Bool")
      }

      return node.value
    case SourceAst.NodeKind.Tuple:
      return tupleType(
        node.children.map(child => tupleTypeElement(childNodeToTypeNode(child, options))),
      )
    case SourceAst.NodeKind.Intersection:
      return compositionType(
        node.children.map(child => compositionTypeElement(childNodeToTypeNode(child, options))),
      )
  }
}

const childNodeToExprNode = (node: SourceAst.ChildNode, options: SwiftOptions): ExprNode => {
  switch (node.kind) {
    case SourceAst.NodeKind.Record:
      throw new Error("Anonymous structs are not supported in Swift")
    case SourceAst.NodeKind.Dictionary:
      throw new Error("Dictionary expressions are currently not supported")
    // return dictionaryExpr(
    //   identifierToken("String"),
    //   childNodeToExprNode(node.children, options)
    // )
    case SourceAst.NodeKind.Token:
      switch (node.token) {
        case SourceAst.TokenKind.String:
          return declReferenceExpr(identifierToken("String"))
        case SourceAst.TokenKind.Number:
          return declReferenceExpr(identifierToken("Int"))
        case SourceAst.TokenKind.Boolean:
          return declReferenceExpr(identifierToken("Bool"))
      }
    case SourceAst.NodeKind.Reference:
      return declReferenceExpr(
        identifierToken(forcePascal(renderQualifiedName(node.name), options)),
        node.typeArguments === undefined
          ? undefined
          : node.typeArguments
              .filter(SourceAst.isReferenceNode)
              .map(arg =>
                declNameArgument(
                  identifierToken(forcePascal(renderQualifiedName(arg.name), options)),
                ),
              ),
      )
    case SourceAst.NodeKind.Array:
      return arrayExpr([childNodeToExprNode(node.children, options)])
    case SourceAst.NodeKind.Union:
      throw new Error("Anonymous union nodes are not supported in Swift")
    case SourceAst.NodeKind.Literal:
      if (typeof node.value === "string") {
        return declReferenceExpr(identifierToken("String"))
      }
      if (typeof node.value === "number") {
        return Number.isInteger(node.value)
          ? declReferenceExpr(identifierToken("Int"))
          : declReferenceExpr(identifierToken("Double"))
      }
      if (typeof node.value === "boolean") {
        return declReferenceExpr(identifierToken("Bool"))
      }

      return node.value
    case SourceAst.NodeKind.Tuple:
      return tupleExpr(node.children.map(child => labeledExpr(childNodeToExprNode(child, options))))
    case SourceAst.NodeKind.Intersection:
      throw new Error("Intersections are not supported in expression position in Swift")
  }
}

const renderQualifiedName = (name: SourceAst.QualifiedName): string =>
  name.right === undefined ? name.segment : renderQualifiedName(name.right)

const toCamel = (name: string): string => {
  if (name === "") {
    return name
  }

  const joined = name.replace(/[_\- ]([A-Za-z])/g, (_, letter) => letter.toUpperCase())
  return joined[0]!.toLowerCase() + joined.slice(1)
}

const toPascal = (name: string): string => {
  if (name === "") {
    return name
  }

  const joined = name.replace(/[_\- ]([A-Za-z])/g, (_, letter) => letter.toUpperCase())
  return joined[0]!.toUpperCase() + joined.slice(1)
}

const forceCamel = (name: string, options: SwiftOptions): string =>
  options.convertIdentifiersToNamingConvention === true ? toCamel(name) : name

const forcePascal = (name: string, options: SwiftOptions): string =>
  options.convertIdentifiersToNamingConvention === true ? toPascal(name) : name

const keywords = (() => {
  const keywordMap: { [K in Keyword]: K } = {
    Any: Keyword.Any,
    Protocol: Keyword.Protocol,
    Self: Keyword.Self,
    Sendable: Keyword.Sendable,
    Type: Keyword.Type,
    accesses: Keyword.accesses,
    actor: Keyword.actor,
    addressWithNativeOwner: Keyword.addressWithNativeOwner,
    addressWithOwner: Keyword.addressWithOwner,
    any: Keyword.any,
    as: Keyword.as,
    assignment: Keyword.assignment,
    associatedtype: Keyword.associatedtype,
    associativity: Keyword.associativity,
    async: Keyword.async,
    attached: Keyword.attached,
    autoclosure: Keyword.autoclosure,
    availability: Keyword.availability,
    available: Keyword.available,
    await: Keyword.await,
    backDeployed: Keyword.backDeployed,
    before: Keyword.before,
    block: Keyword.block,
    borrowing: Keyword.borrowing,
    break: Keyword.break,
    cType: Keyword.cType,
    canImport: Keyword.canImport,
    case: Keyword.case,
    catch: Keyword.catch,
    class: Keyword.class,
    compiler: Keyword.compiler,
    consume: Keyword.consume,
    consuming: Keyword.consuming,
    continue: Keyword.continue,
    convenience: Keyword.convenience,
    convention: Keyword.convention,
    copy: Keyword.copy,
    default: Keyword.default,
    defer: Keyword.defer,
    deinit: Keyword.deinit,
    deprecated: Keyword.deprecated,
    derivative: Keyword.derivative,
    didSet: Keyword.didSet,
    differentiable: Keyword.differentiable,
    discard: Keyword.discard,
    distributed: Keyword.distributed,
    do: Keyword.do,
    dynamic: Keyword.dynamic,
    each: Keyword.each,
    else: Keyword.else,
    enum: Keyword.enum,
    escaping: Keyword.escaping,
    exclusivity: Keyword.exclusivity,
    exported: Keyword.exported,
    extension: Keyword.extension,
    fallthrough: Keyword.fallthrough,
    false: Keyword.false,
    file: Keyword.file,
    fileprivate: Keyword.fileprivate,
    final: Keyword.final,
    for: Keyword.for,
    forward: Keyword.forward,
    freestanding: Keyword.freestanding,
    func: Keyword.func,
    get: Keyword.get,
    guard: Keyword.guard,
    higherThan: Keyword.higherThan,
    if: Keyword.if,
    import: Keyword.import,
    in: Keyword.in,
    indirect: Keyword.indirect,
    infix: Keyword.infix,
    init: Keyword.init,
    initializes: Keyword.initializes,
    inline: Keyword.inline,
    inout: Keyword.inout,
    internal: Keyword.internal,
    introduced: Keyword.introduced,
    is: Keyword.is,
    isolated: Keyword.isolated,
    kind: Keyword.kind,
    lazy: Keyword.lazy,
    left: Keyword.left,
    let: Keyword.let,
    line: Keyword.line,
    linear: Keyword.linear,
    lowerThan: Keyword.lowerThan,
    macro: Keyword.macro,
    message: Keyword.message,
    metadata: Keyword.metadata,
    module: Keyword.module,
    mutableAddressWithNativeOwner: Keyword.mutableAddressWithNativeOwner,
    mutableAddressWithOwner: Keyword.mutableAddressWithOwner,
    mutating: Keyword.mutating,
    nil: Keyword.nil,
    noDerivative: Keyword.noDerivative,
    noasync: Keyword.noasync,
    noescape: Keyword.noescape,
    none: Keyword.none,
    nonisolated: Keyword.nonisolated,
    nonmutating: Keyword.nonmutating,
    objc: Keyword.objc,
    obsoleted: Keyword.obsoleted,
    of: Keyword.of,
    open: Keyword.open,
    operator: Keyword.operator,
    optional: Keyword.optional,
    override: Keyword.override,
    package: Keyword.package,
    postfix: Keyword.postfix,
    precedencegroup: Keyword.precedencegroup,
    preconcurrency: Keyword.preconcurrency,
    prefix: Keyword.prefix,
    private: Keyword.private,
    protocol: Keyword.protocol,
    public: Keyword.public,
    reasync: Keyword.reasync,
    renamed: Keyword.renamed,
    repeat: Keyword.repeat,
    required: Keyword.required,
    rethrows: Keyword.rethrows,
    retroactive: Keyword.retroactive,
    return: Keyword.return,
    reverse: Keyword.reverse,
    right: Keyword.right,
    safe: Keyword.safe,
    self: Keyword.self,
    sending: Keyword.sending,
    set: Keyword.set,
    some: Keyword.some,
    sourceFile: Keyword.sourceFile,
    spi: Keyword.spi,
    spiModule: Keyword.spiModule,
    static: Keyword.static,
    struct: Keyword.struct,
    subscript: Keyword.subscript,
    super: Keyword.super,
    swift: Keyword.swift,
    switch: Keyword.switch,
    target: Keyword.target,
    then: Keyword.then,
    throw: Keyword.throw,
    throws: Keyword.throws,
    transpose: Keyword.transpose,
    true: Keyword.true,
    try: Keyword.try,
    typealias: Keyword.typealias,
    unavailable: Keyword.unavailable,
    unchecked: Keyword.unchecked,
    unowned: Keyword.unowned,
    unsafe: Keyword.unsafe,
    unsafeAddress: Keyword.unsafeAddress,
    unsafeMutableAddress: Keyword.unsafeMutableAddress,
    var: Keyword.var,
    visibility: Keyword.visibility,
    weak: Keyword.weak,
    where: Keyword.where,
    while: Keyword.while,
    willSet: Keyword.willSet,
    witness_method: Keyword.witness_method,
    wrt: Keyword.wrt,
    yield: Keyword.yield,
  }
  return new Set(Object.keys(keywordMap))
})()

const safeIdentifier = (name: string): string =>
  /[^a-zA-Z0-9_]/.test(name) || keywords.has(name) ? `\`${name}\`` : name

const typeParameterNodesToGenericParameterClause = (
  nodes: SourceAst.TypeParameterNode[] | undefined,
  options: SwiftOptions,
  mainIdentifier: string | undefined,
): GenericParameterClauseNode | undefined =>
  nodes === undefined
    ? undefined
    : genericParameterClause(
        nodes.map(node =>
          genericParameter(
            forcePascal(node.name, options),
            joinTypes(
              node.constraint ? childNodeToTypeNode(node.constraint, options) : undefined,
              ...(addConformances(node, node.name, mainIdentifier, options) ?? []),
            ),
          ),
        ),
      )

const addConformances = (
  node:
    | SourceAst.RecordNode
    | SourceAst.UnionNode
    | SourceAst.EnumerationNode
    | SourceAst.TypeParameterNode,
  identifier: string,
  mainIdentifier: string | undefined,
  options: SwiftOptions,
): TypeNode[] | undefined => {
  const applyingAddedConformances =
    options.addConformances?.filter(
      conformance =>
        conformance.forMainTypes === undefined ||
        (identifier === mainIdentifier) === conformance.forMainTypes,
    ) ?? []

  const addedConformances = applyingAddedConformances.map(conformance =>
    identifierType(
      typeof conformance.identifier === "string"
        ? conformance.identifier
        : conformance.identifier(node),
    ),
  )

  const addedDecodable =
    options.decodableSynthesization !== undefined &&
    applyingAddedConformances.every(conformance => conformance.includesDecodable !== true)
      ? [identifierType("Decodable")]
      : []

  const allConformances = [...addedConformances, ...addedDecodable]

  return allConformances.length > 0 ? allConformances : undefined
}

const childNodeToDeclNode = (
  name: string,
  jsDoc: SourceAst.Doc | undefined,
  typeParameters: SourceAst.TypeParameterNode[] | undefined,
  node: SourceAst.ChildNode,
  options: SwiftOptions,
  mainIdentifier: string | undefined,
): DeclNode => {
  switch (node.kind) {
    case SourceAst.NodeKind.Record: {
      const variables = node.members.map(member => ({
        jsDoc: member.jsDoc,
        attributes: deprecatedDocToAttribute(member.jsDoc),
        modifiers: accessControlModifier(options),
        originalIdentifier: member.identifier,
        identifier: safeIdentifier(forceCamel(member.identifier, options)),
        type: member.isRequired
          ? childNodeToTypeNode(member.value, options)
          : optionalType(childNodeToTypeNode(member.value, options)),
        keywordSpecifier:
          (options.forceConstantStructMembers ?? member.isReadOnly) ? Keyword.let : Keyword.var,
      }))

      return structDecl(
        forcePascal(name, options),
        {
          jsDoc,
          attributes: deprecatedDocToAttribute(jsDoc),
          modifiers: accessControlModifier(options),
          genericParameterClause: typeParameterNodesToGenericParameterClause(
            typeParameters,
            options,
            mainIdentifier,
          ),
          inheritanceClause: addConformances(node, name, mainIdentifier, options),
        },
        filterNonNullable([
          ...variables.map(variable =>
            variableDecl(
              {
                jsDoc: variable.jsDoc,
                attributes: variable.attributes,
                modifiers: variable.modifiers,
              },
              variable.keywordSpecifier,
              [patternBinding(identifierPattern(variable.identifier), variable.type)],
            ),
          ),
          options.generateStructInitializers === true
            ? initializerDecl(
                {
                  modifiers: accessControlModifier(options),
                },
                functionSignature(
                  variables.map(variable =>
                    functionParameter(variable.type, variable.identifier, undefined, {
                      defaultValue: isOptionalTypeNode(variable.type) ? nilLiteralExpr : undefined,
                    }),
                  ),
                ),
                variables.map(variable =>
                  infixOperatorExpr(
                    memberAccessExpr(
                      declReferenceExpr(identifierToken(variable.identifier)),
                      declReferenceExpr(keywordToken(Keyword.self)),
                    ),
                    assignmentExpr,
                    declReferenceExpr(identifierToken(variable.identifier)),
                  ),
                ),
              )
            : undefined,
          ...(options.decodableSynthesization !== undefined &&
          variables.some(variable => variable.originalIdentifier !== variable.identifier)
            ? [
                enumDecl(
                  "CodingKeys",
                  {
                    modifiers: [declModifier(keywordToken(Keyword.private))],
                    inheritanceClause: [identifierType("String"), identifierType("CodingKey")],
                  },
                  variables.map(variable =>
                    enumCaseDecl({}, [
                      enumCaseElement(
                        forceCamel(variable.identifier, options),
                        undefined,
                        stringLiteralExpr(variable.originalIdentifier),
                      ),
                    ]),
                  ),
                ),
                // initializerDecl(
                //   {
                //     modifiers: accessControlModifier(options),
                //   },
                //   functionSignature(
                //     [
                //       functionParameter(
                //         someOrAnyType(Keyword.any, identifierType("Decoder")),
                //         "from",
                //         "decoder"
                //       ),
                //     ],
                //     functionEffectSpecifiers({
                //       throwsClause: throwsClause(Keyword.throws),
                //     })
                //   ),
                //   variables.map((variable) =>
                //     infixOperatorExpr(
                //       memberAccessExpr(
                //         declReferenceExpr(identifierToken(variable.identifier)),
                //         declReferenceExpr(keywordToken(Keyword.self))
                //       ),
                //       assignmentExpr,
                //       declReferenceExpr(identifierToken(variable.identifier))
                //     )
                //   )
                // ),
              ]
            : []),
        ]),
      )
    }
    case SourceAst.NodeKind.Dictionary:
    case SourceAst.NodeKind.Token:
    case SourceAst.NodeKind.Reference:
    case SourceAst.NodeKind.Array:
    case SourceAst.NodeKind.Tuple:
    case SourceAst.NodeKind.Intersection:
      return typeAliasDecl(
        forcePascal(name, options),
        {
          jsDoc,
          attributes: deprecatedDocToAttribute(jsDoc),
          modifiers: accessControlModifier(options),
          genericParameterClause: typeParameterNodesToGenericParameterClause(
            typeParameters,
            options,
            mainIdentifier,
          ),
        },
        childNodeToTypeNode(node, options),
      )
    case SourceAst.NodeKind.Union:
      if (
        options.decodableSynthesization !== undefined &&
        node.children.every(caseNode => {
          const tagMember =
            caseNode.kind === SourceAst.NodeKind.Record
              ? caseNode.members.find(
                  member => member.identifier === options.decodableSynthesization!.discriminatorKey,
                )
              : undefined
          return (
            tagMember?.value.kind === SourceAst.NodeKind.Literal &&
            typeof tagMember.value.value === "string"
          )
        })
      ) {
        const enumCases = (node.children as SourceAst.RecordNode[]).map(member => {
          const tag = (
            member.members.find(
              member => member.identifier === options.decodableSynthesization!.discriminatorKey,
            )!.value as SourceAst.LiteralNode
          ).value as string
          const valueMember = member.members.find(
            recordMember =>
              recordMember.identifier !== options.decodableSynthesization!.discriminatorKey,
          )!
          return {
            tag,
            value: valueMember.value,
            valueKey: valueMember.identifier,
            jsDoc: member.jsDoc,
            attributes: deprecatedDocToAttribute(member.jsDoc),
            identifier: safeIdentifier(forceCamel(tag, options)),
          }
        })

        return enumDecl(
          forcePascal(name, options),
          {
            jsDoc,
            attributes: deprecatedDocToAttribute(jsDoc),
            modifiers: accessControlModifier(options),
            genericParameterClause: typeParameterNodesToGenericParameterClause(
              typeParameters,
              options,
              mainIdentifier,
            ),
            inheritanceClause: addConformances(node, name, mainIdentifier, options),
          },
          [
            ...enumCases.map(enumCase =>
              enumCaseDecl(
                {
                  jsDoc: enumCase.jsDoc,
                  attributes: enumCase.attributes,
                },
                [
                  enumCaseElement(
                    enumCase.identifier,
                    enumCase.value.kind === SourceAst.NodeKind.Record &&
                      enumCase.value.members.length === 0
                      ? undefined
                      : [enumCaseParameter(childNodeToTypeNode(enumCase.value, options))],
                  ),
                ],
              ),
            ),
            ...(options.decodableSynthesization !== undefined && node.children.length > 0
              ? [
                  enumDecl(
                    "CodingKeys",
                    {
                      modifiers: [declModifier(keywordToken(Keyword.private))],
                      inheritanceClause: [identifierType("String"), identifierType("CodingKey")],
                    },
                    [
                      enumCaseDecl({}, [
                        enumCaseElement(
                          "tag",
                          undefined,
                          stringLiteralExpr(options.decodableSynthesization.discriminatorKey),
                        ),
                      ]),
                      ...enumCases.map(enumCase =>
                        enumCaseDecl(
                          {
                            attributes: enumCase.attributes,
                          },
                          [
                            enumCaseElement(
                              enumCase.identifier,
                              undefined,
                              stringLiteralExpr(enumCase.valueKey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  enumDecl(
                    "Discriminator",
                    {
                      modifiers: [declModifier(keywordToken(Keyword.private))],
                      inheritanceClause: [identifierType("String"), identifierType("Decodable")],
                    },
                    enumCases.map(enumCase =>
                      enumCaseDecl(
                        {
                          attributes: enumCase.attributes,
                        },
                        [
                          enumCaseElement(
                            enumCase.identifier,
                            undefined,
                            stringLiteralExpr(enumCase.tag),
                          ),
                        ],
                      ),
                    ),
                  ),
                  initializerDecl(
                    {
                      modifiers: accessControlModifier(options),
                    },
                    functionSignature(
                      [
                        functionParameter(
                          someOrAnyType(Keyword.any, identifierType("Decoder")),
                          "from",
                          "decoder",
                        ),
                      ],
                      functionEffectSpecifiers({
                        throwsClause: throwsClause(Keyword.throws),
                      }),
                    ),
                    [
                      variableDecl({}, Keyword.let, [
                        patternBinding(
                          identifierPattern("container"),
                          undefined,
                          tryExpr(
                            functionCallExpr(
                              memberAccessExpr(
                                declReferenceExpr(identifierToken("container")),
                                declReferenceExpr(identifierToken("decoder")),
                              ),
                              [
                                labeledExpr(
                                  memberAccessExpr(
                                    declReferenceExpr(identifierToken("self")),
                                    declReferenceExpr(identifierToken("CodingKeys")),
                                  ),
                                  "keyedBy",
                                ),
                              ],
                            ),
                          ),
                        ),
                      ]),
                      variableDecl({}, Keyword.let, [
                        patternBinding(
                          identifierPattern("tag"),
                          undefined,
                          tryExpr(
                            functionCallExpr(
                              memberAccessExpr(
                                declReferenceExpr(identifierToken("decode")),
                                declReferenceExpr(identifierToken("container")),
                              ),
                              [
                                labeledExpr(
                                  memberAccessExpr(
                                    declReferenceExpr(identifierToken("self")),
                                    declReferenceExpr(identifierToken("Discriminator")),
                                  ),
                                ),
                                labeledExpr(
                                  memberAccessExpr(declReferenceExpr(identifierToken("tag"))),
                                  "forKey",
                                ),
                              ],
                            ),
                          ),
                        ),
                      ]),
                      switchExpr(
                        declReferenceExpr(identifierToken("tag")),
                        enumCases.map(enumCase =>
                          switchCase(
                            switchCaseLabel([
                              expressionPattern(
                                memberAccessExpr(
                                  declReferenceExpr(identifierToken(enumCase.identifier)),
                                ),
                              ),
                            ]),
                            [
                              infixOperatorExpr(
                                declReferenceExpr(keywordToken(Keyword.self)),
                                assignmentExpr,
                                (enumCase.value.kind === SourceAst.NodeKind.Record &&
                                  enumCase.value.members.length > 0) ||
                                  enumCase.value.kind === SourceAst.NodeKind.Reference
                                  ? functionCallExpr(
                                      memberAccessExpr(
                                        declReferenceExpr(identifierToken(enumCase.identifier)),
                                      ),
                                      [
                                        labeledExpr(
                                          tryExpr(
                                            functionCallExpr(
                                              memberAccessExpr(
                                                declReferenceExpr(identifierToken("decode")),
                                                declReferenceExpr(identifierToken("container")),
                                              ),
                                              [
                                                labeledExpr(
                                                  memberAccessExpr(
                                                    declReferenceExpr(identifierToken("self")),
                                                    childNodeToExprNode(enumCase.value, options),
                                                  ),
                                                ),
                                                labeledExpr(
                                                  memberAccessExpr(
                                                    declReferenceExpr(
                                                      identifierToken(enumCase.identifier),
                                                    ),
                                                  ),
                                                  "forKey",
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    )
                                  : memberAccessExpr(
                                      declReferenceExpr(identifierToken(enumCase.identifier)),
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ]
              : []),
          ],
        )
      }

      if (node.children.every(SourceAst.isReferenceNode)) {
        return enumDecl(
          forcePascal(name, options),
          {
            jsDoc,
            attributes: deprecatedDocToAttribute(jsDoc),
            modifiers: accessControlModifier(options),
            genericParameterClause: typeParameterNodesToGenericParameterClause(
              typeParameters,
              options,
              mainIdentifier,
            ),
            inheritanceClause: addConformances(node, name, mainIdentifier, options),
          },
          filterNonNullable([
            ...node.children.map(ref =>
              enumCaseDecl(
                {
                  jsDoc: ref.jsDoc,
                  attributes: deprecatedDocToAttribute(ref.jsDoc),
                },
                [
                  enumCaseElement(
                    safeIdentifier(forceCamel(renderQualifiedName(ref.name), options)),
                    [enumCaseParameter(childNodeToTypeNode(ref, options))],
                  ),
                ],
              ),
            ),
            options.decodableSynthesization !== undefined && node.children.length > 0
              ? initializerDecl(
                  {
                    modifiers: accessControlModifier(options),
                  },
                  functionSignature(
                    [
                      functionParameter(
                        someOrAnyType(Keyword.any, identifierType("Decoder")),
                        "from",
                        "decoder",
                      ),
                    ],
                    functionEffectSpecifiers({
                      throwsClause: throwsClause(Keyword.throws),
                    }),
                  ),
                  [
                    variableDecl({}, Keyword.let, [
                      patternBinding(
                        identifierPattern("container"),
                        undefined,
                        tryExpr(
                          functionCallExpr(
                            memberAccessExpr(
                              declReferenceExpr(identifierToken("singleValueContainer")),
                              declReferenceExpr(identifierToken("decoder")),
                            ),
                          ),
                        ),
                      ),
                    ]),
                    expressionStmt(
                      node.children.reduceRight(
                        (acc: IfExprNode | CodeBlockNode, ref): IfExprNode => {
                          const identifier = forceCamel(renderQualifiedName(ref.name), options)

                          return ifExpr(
                            [
                              optionalBindingCondition(
                                Keyword.let,
                                identifierPattern(identifier),
                                undefined,
                                tryExpr(
                                  functionCallExpr(
                                    memberAccessExpr(
                                      declReferenceExpr(identifierToken("decode")),
                                      declReferenceExpr(identifierToken("container")),
                                    ),
                                    [
                                      labeledExpr(
                                        memberAccessExpr(
                                          declReferenceExpr(identifierToken("self")),
                                          declReferenceExpr(
                                            identifierToken(renderQualifiedName(ref.name)),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  postfixQuestionMarkToken,
                                ),
                              ),
                            ],
                            [
                              infixOperatorExpr(
                                declReferenceExpr(identifierToken("self")),
                                assignmentExpr,
                                functionCallExpr(
                                  memberAccessExpr(declReferenceExpr(identifierToken(identifier))),
                                  [labeledExpr(declReferenceExpr(identifierToken(identifier)))],
                                ),
                              ),
                            ],
                            isCodeBlockNode(acc)
                              ? acc.statements.items.map(item => item.item)
                              : acc,
                          )
                        },
                        codeBlock([
                          throwStmt(
                            functionCallExpr(
                              memberAccessExpr(
                                declReferenceExpr(identifierToken("dataCorruptedError")),
                                declReferenceExpr(identifierToken("DecodingError")),
                              ),
                              [
                                labeledExpr(declReferenceExpr(identifierToken("container")), "in"),
                                labeledExpr(
                                  stringLiteralExpr(`No ${name} type found`),
                                  "debugDescription",
                                ),
                              ],
                            ),
                          ),
                        ]),
                      ) as IfExprNode,
                    ),
                  ],
                )
              : undefined,
          ]),
        )
      }

      if (
        node.children.every(SourceAst.isLiteralNode) &&
        node.children.every(node => typeof node.value === "string")
      ) {
        return enumDecl(
          forcePascal(name, options),
          {
            jsDoc,
            attributes: deprecatedDocToAttribute(jsDoc),
            modifiers: accessControlModifier(options),
            inheritanceClause: [
              identifierType("String"),
              ...(addConformances(node, name, mainIdentifier, options) ?? []),
            ],
          },
          node.children.map(literal =>
            enumCaseDecl(
              {
                jsDoc: literal.jsDoc,
                attributes: deprecatedDocToAttribute(literal.jsDoc),
              },
              [
                enumCaseElement(
                  safeIdentifier(forceCamel(literal.value as string, options)),
                  undefined,
                  stringLiteralExpr(literal.value as string),
                ),
              ],
            ),
          ),
        )
      }

      if (
        node.children.every(SourceAst.isLiteralNode) &&
        node.children.every(node => typeof node.value === "number")
      ) {
        const isInt = node.children.every(node => Number.isInteger(node.value))
        const rawType = isInt ? "Int" : "Double"

        return enumDecl(
          forcePascal(name, options),
          {
            jsDoc,
            attributes: deprecatedDocToAttribute(jsDoc),
            modifiers: accessControlModifier(options),
            inheritanceClause: [
              identifierType(rawType),
              ...(addConformances(node, name, mainIdentifier, options) ?? []),
            ],
          },
          node.children.map(literal =>
            enumCaseDecl(
              {
                jsDoc: literal.jsDoc,
                attributes: deprecatedDocToAttribute(literal.jsDoc),
              },
              [
                enumCaseElement(
                  `_${literal.value}`,
                  undefined,
                  isInt
                    ? integerLiteralExpr(literal.value as number)
                    : floatLiteralExpr(literal.value as number),
                ),
              ],
            ),
          ),
        )
      }

      throw new Error("Cannot create enumeration declaration from union node")
    case SourceAst.NodeKind.Literal:
      if (typeof node.value === "string" || typeof node.value === "number") {
        return childNodeToDeclNode(
          name,
          jsDoc,
          typeParameters,
          {
            kind: SourceAst.NodeKind.Union,
            fileName: node.fileName,
            children: [node],
          },
          options,
          mainIdentifier,
        )
      }

      throw new Error("Cannot create enumeration declaration from literal node")
    default:
      return assertExhaustive(node)
  }
}

export const statementNodeToDeclNode = (
  node: SourceAst.StatementNode,
  options: SwiftOptions,
  mainIdentifier: string | undefined,
): DeclNode | undefined => {
  if (ignoreNode(node, IGNORE_ENV)) {
    return undefined
  }

  switch (node.kind) {
    case SourceAst.NodeKind.Group:
      return enumDecl(
        forcePascal(node.name, options),
        {
          jsDoc: node.jsDoc,
          attributes: deprecatedDocToAttribute(node.jsDoc),
          modifiers: accessControlModifier(options),
        },
        node.children
          .map(child => statementNodeToDeclNode(child, options, mainIdentifier))
          .filter(isNotNullish),
      )
    case SourceAst.NodeKind.Enumeration:
      return enumDecl(
        forcePascal(node.name, options),
        {
          jsDoc: node.jsDoc,
          attributes: deprecatedDocToAttribute(node.jsDoc),
          modifiers: accessControlModifier(options),
          inheritanceClause: [
            identifierType(
              node.children.every(child => typeof child.value === "string")
                ? "String"
                : node.children.every(
                      child => typeof child.value === "number" && Number.isInteger(child.value),
                    )
                  ? "Int"
                  : "Double",
            ),
            ...(addConformances(node, node.name, mainIdentifier, options) ?? []),
          ],
        },
        node.children.map(member =>
          enumCaseDecl(
            {
              jsDoc: member.jsDoc,
              attributes: deprecatedDocToAttribute(member.jsDoc),
            },
            [
              enumCaseElement(
                forceCamel(member.name, options),
                undefined,
                typeof member.value === "string"
                  ? stringLiteralExpr(member.value)
                  : Number.isInteger(member.value)
                    ? integerLiteralExpr(member.value)
                    : floatLiteralExpr(member.value),
              ),
            ],
          ),
        ),
      )
    case SourceAst.NodeKind.TypeDefinition:
      return childNodeToDeclNode(
        node.name,
        node.jsDoc,
        node.typeParameters,
        node.definition,
        options,
        mainIdentifier,
      )
    case SourceAst.NodeKind.ExportAssignment:
      return childNodeToDeclNode(
        node.name,
        node.jsDoc,
        undefined,
        node.expression,
        options,
        mainIdentifier,
      )
    default:
      return assertExhaustive(node)
  }
}

export const transformAst = (
  node: SourceAst.RootNode,
  options: SwiftOptions,
  mainIdentifier: string | undefined,
): DeclNode[] | undefined =>
  ignoreNode(node, IGNORE_ENV)
    ? undefined
    : node.children
        .map(child => statementNodeToDeclNode(child, options, mainIdentifier))
        .filter(isNotNullish)
