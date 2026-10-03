export class UniqueConstraintError extends Error {
  readonly parts: string[]
  constructor(message: string, parts: string[]) {
    super(message)
    this.parts = parts
  }
}
