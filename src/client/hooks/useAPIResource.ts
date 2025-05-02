import { useMappedAPIResource } from "./useMappedAPIResource.js"

export const useAPIResource = <T, A extends any[]>(
  apiFn: (...args: A) => Promise<T>,
  ...args: A
): [T | undefined, () => Promise<void>] => useMappedAPIResource(apiFn, data => data, ...args)
