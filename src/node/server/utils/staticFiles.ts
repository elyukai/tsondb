import mime from "mime"
import { createReadStream } from "node:fs"
import { access } from "node:fs/promises"
import { join } from "node:path"

// adapted from https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Node_server_without_framework

export const serveStaticFiles = async (rootPath: string, urlPath: string) => {
  const urlAsPath = decodeURI(urlPath)
  const paths = [rootPath, urlAsPath]
  const filePath = join(...paths)
  const isInRoot = filePath.startsWith(rootPath)
  const exists = await access(filePath).then(
    () => true,
    () => false,
  )
  const found = isInRoot && exists
  const mimeType = mime.getType(filePath)

  if (found && mimeType) {
    return { mime: mimeType, stream: createReadStream(filePath) }
  }

  return
}
