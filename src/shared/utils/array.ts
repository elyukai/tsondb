export const removeAt = <T>(arr: T[], index: number): T[] => {
  if (index < 0 || index >= arr.length) {
    throw new RangeError(
      `index ${index.toString()} is out of bounds for array of length ${arr.length.toString()}`,
    )
  }

  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

export const insertAt = <T>(arr: T[], index: number, item: T): T[] => {
  if (index < 0 || index > arr.length) {
    throw new RangeError(
      `index ${index.toString()} is out of bounds for array of length ${arr.length.toString()}`,
    )
  }

  return [...arr.slice(0, index), item, ...arr.slice(index)]
}

/**
 * Calculates the difference between two arrays, including duplicated values.
 * @param oldArr - The original array.
 * @param newArr - The new array to compare against.
 * @returns An object containing the added and removed elements.
 */
export const difference = <T>(oldArr: T[], newArr: T[]): ArrayDiffResult<T> =>
  newArr.reduce(
    (acc: ArrayDiffResult<T>, item) => {
      const oldIndex = acc.removed.indexOf(item)
      const newIndex = acc.added.indexOf(item)
      if (oldIndex > -1) {
        return {
          ...acc,
          removed: removeAt(acc.removed, oldIndex),
          added: removeAt(acc.added, newIndex),
        }
      }
      return acc
    },
    { removed: oldArr, added: newArr },
  )

export interface ArrayDiffResult<T> {
  /**
   * Elements in `newArr` that are not in `oldArr`.
   */
  added: T[]

  /**
   * Elements in `oldArr` that are not in `newArr`.
   */
  removed: T[]
}

export const unique = <T>(arr: T[], equalityCheck: (a: T, b: T) => boolean = (a, b) => a === b) =>
  arr.filter((item, index) => arr.findIndex(other => equalityCheck(item, other)) === index)
