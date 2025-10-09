import type { ComponentChildren, Context } from "preact"

export type ContextProviderWrapper = <T>(props: {
  children?: ComponentChildren
  context: Context<T>
  useValue: () => T
}) => ComponentChildren

export const ContextProviderWrapper: ContextProviderWrapper = props => {
  const { children, context, useValue } = props
  return <context.Provider value={useValue()}>{children}</context.Provider>
}
