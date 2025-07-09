import { useMappedAPIResource } from "./useMappedAPIResource.js"

export const useAPIResource = <T, A extends unknown[]>(
  apiFn: (...args: A) => Promise<T>,
  ...args: A
): [T | undefined, () => Promise<void>] => useMappedAPIResource(apiFn, data => data, ...args)
