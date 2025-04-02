export abstract class Type {
  /**
   * Throws if the value is not valid for this type
   * @param value The value to validate
   */
  abstract validate(value: unknown): void

  abstract replaceTypeArguments(args: Record<string, Type>): Type
}
