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

/**
 * Moves an element from one position to another within the array.
 */
export const reorder = <T>(arr: T[], sourceIndex: number, targetIndex: number): T[] => {
  if (sourceIndex < 0 || sourceIndex >= arr.length) {
    throw new RangeError(
      `source index ${sourceIndex.toString()} is out of bounds for array of length ${arr.length.toString()}`,
    )
  }

  if (targetIndex < 0 || targetIndex >= arr.length) {
    throw new RangeError(
      `target index ${targetIndex.toString()} is out of bounds for array of length ${arr.length.toString()}`,
    )
  }

  if (sourceIndex === targetIndex) {
    return arr
  }

  if (sourceIndex < targetIndex) {
    return [
      ...arr.slice(0, sourceIndex),
      ...arr.slice(sourceIndex + 1, targetIndex + 1),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      arr[sourceIndex]!,
      ...arr.slice(targetIndex + 1),
    ]
  }

  return [
    ...arr.slice(0, targetIndex),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    arr[sourceIndex]!,
    ...arr.slice(targetIndex, sourceIndex),
    ...arr.slice(sourceIndex + 1),
  ]
}
