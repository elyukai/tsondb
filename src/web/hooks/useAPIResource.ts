import { useMappedAPIResource } from "./useMappedAPIResource.js"

const identity = <T>(data: T): T => data

export const useAPIResource = <T, A extends unknown[]>(
  apiFn: (...args: A) => Promise<T>,
  ...args: A
): [T | undefined, () => Promise<void>] => useMappedAPIResource(apiFn, identity, ...args)
