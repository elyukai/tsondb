import { signal } from "@preact/signals"

export const loading = signal(false)

export const runWithLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
  loading.value = true
  try {
    return await fn()
  } finally {
    loading.value = false
  }
}
