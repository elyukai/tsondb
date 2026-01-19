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
 * Checks if there are any duplicate elements in the array.
 */
export const anySame = <T>(arr: T[], equalityCheck: (a: T, b: T) => boolean = (a, b) => a === b) =>
  arr.some((item, index) => arr.findIndex(other => equalityCheck(item, other)) !== index)

/**
 * Checks if there are any duplicate elements in the array and returns an array
 * of found duplicates where the values are the indices of these values.
 */
export const anySameIndices = <T>(
  arr: T[],
  equalityCheck: (a: T, b: T) => boolean = (a, b) => a === b,
): number[][] =>
  arr.reduce((acc: number[][], item, index) => {
    const firstIndex = arr.findIndex(other => equalityCheck(item, other))
    if (firstIndex === index) {
      return acc
    }
    const accIndex = acc.findIndex(accElem => accElem[0] === firstIndex)
    return accIndex === -1
      ? [...acc, [firstIndex, index]]
      : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- The index must exist according to the findIndex above
        acc.with(accIndex, [...acc[accIndex]!, index])
  }, [])

/**
 * Returns the possibilities of all the combinations of nested array values.
 *
 * @example
 *
 * flatCombine([["a", "b"], ["c"]]) // [["a", "c"], ["b", "c"]]
 * flatCombine([["a", "b"], ["c", "d"]]) // [["a", "c"], ["b", "c"], ["a", "d"], ["b", "d"]]
 */
export const flatCombine = <T>(arr: T[][]): T[][] =>
  arr.length === 0
    ? []
    : arr.slice(1).reduce<T[][]>(
        (acc, elem) => elem.flatMap(elemInner => acc.map(accElem => [...accElem, elemInner])),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it is checked before if the array is empty
        arr[0]!.map(elem => [elem]),
      )

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

/**
 * Splits an array into chunks of a specified size.
 * @param arr The array to be chunked.
 * @param size The size of each chunk.
 * @returns An array of chunks, where each chunk is an array of elements. The last chunk may be smaller than the specified size if there are not enough elements left.
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) {
    throw new RangeError(`size must be a positive integer, got ${size.toString()}`)
  }

  return arr.reduce((chunks: T[][], item, index) => {
    const chunkIndex = Math.floor(index / size)
    ;(chunks[chunkIndex] ??= []).push(item)
    return chunks
  }, [])
}

/**
 * Checks if the array is empty.
 */
export const isEmpty = (arr: unknown[]): arr is [] => arr.length === 0

/**
 * A type representing a non-empty array, i.e., an array with at least one element.
 */
export type NonEmptyArray<T> = [T, ...T[]]

/**
 * Checks if the array is not empty, i.e., contains at least one element.
 */
export const isNotEmpty = <T>(arr: T[]): arr is NonEmptyArray<T> => !isEmpty(arr)
