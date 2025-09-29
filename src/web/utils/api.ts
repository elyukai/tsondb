const request = async <R>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  options: {
    locales: string[]
    body?: unknown
    headers?: HeadersInit
    modifyUrl?: (url: URL) => void
    getResult?: (response: Response) => Promise<R>
  },
): Promise<R> => {
  const resolvedUrl = new URL(url, window.location.origin)

  for (const locale of options.locales) {
    resolvedUrl.searchParams.append("locales", locale)
  }

  if (options.modifyUrl) {
    options.modifyUrl(resolvedUrl)
  }

  const headers = new Headers(options.headers)

  if (options.body && !headers.has("Content-Type")) {
    headers.append("Content-Type", "application/json")
  }

  const response = await fetch(resolvedUrl, {
    method: method,
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers,
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return (
    options.getResult ??
    (response => {
      if (response.headers.get("Content-Type")?.startsWith("application/json") === true) {
        return response.json() as Promise<R>
      } else {
        return Promise.resolve() as Promise<R>
      }
    })
  )(response)
}

export const getResource = async <R>(
  url: string,
  options: {
    locales: string[]
    modifyUrl?: (url: URL) => void
    getResult?: (response: Response) => Promise<R>
  },
): Promise<R> => request<R>("GET", url, options)

export const postResource = async <R = void>(
  url: string,
  options: {
    locales: string[]
    body?: unknown
    headers?: HeadersInit
    modifyUrl?: (url: URL) => void
    getResult?: (response: Response) => Promise<R>
  },
): Promise<R> => request<R>("POST", url, options)

export const putResource = async <R = void>(
  url: string,
  options: {
    locales: string[]
    body?: unknown
    headers?: HeadersInit
    modifyUrl?: (url: URL) => void
    getResult?: (response: Response) => Promise<R>
  },
): Promise<R> => request<R>("PUT", url, options)

export const deleteResource = async <R = void>(
  url: string,
  options: {
    locales: string[]
    headers?: HeadersInit
    modifyUrl?: (url: URL) => void
    getResult?: (response: Response) => Promise<R>
  },
): Promise<R> => request<R>("DELETE", url, options)
