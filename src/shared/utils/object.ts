export type Leaves<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends unknown[]
        ? never
        : `${Extract<K, string>}${Leaves<T[K]> extends never ? "" : `.${Leaves<T[K]>}`}`
    }[keyof T]
  : never
