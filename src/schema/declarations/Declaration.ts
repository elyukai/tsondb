export abstract class Declaration {
  sourceUrl: string

  constructor(sourceUrl: string) {
    this.sourceUrl = sourceUrl
  }

  abstract getNestedDeclarations(): Declaration[]
}
