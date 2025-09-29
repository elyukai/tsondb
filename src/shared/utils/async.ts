/**
 * A simple async map to process tasks with a concurrency limit.
 * @param tasks The list of tasks to process.
 * @param worker The async function to process each task.
 * @param concurrency The maximum number of concurrent tasks.
 * @returns A promise that resolves to the list of results.
 */
export const mapAsync = <T, R>(
  tasks: readonly T[],
  worker: (task: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> =>
  new Promise((resolve, reject) => {
    const results: R[] = []

    let activeIndex = 0
    let activeCount = 0
    let resolvedCount = 0

    const totalCount = tasks.length

    const runNext = () => {
      if (resolvedCount === totalCount) {
        resolve(results)
      } else {
        while (activeCount < concurrency && activeIndex < totalCount) {
          const currentIndex = activeIndex++
          const task = tasks[currentIndex] as T
          activeCount++

          worker(task)
            .then(result => {
              results[currentIndex] = result
              resolvedCount++
              activeCount--
              runNext()
            })
            .catch(reject)
        }
      }
    }

    runNext()
  })
