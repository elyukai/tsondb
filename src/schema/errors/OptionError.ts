export class OptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OptionError"
  }
}
