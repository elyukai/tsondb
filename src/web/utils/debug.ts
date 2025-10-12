export const printJson = (data: unknown) =>
  JSON.stringify(data, undefined, 2)
    .replace(/\n *([}\]],?)/g, " $1")
    .replace(/((?:^|\n *)[{[])\n +/g, "$1 ")
    .replace(/"(.+?)":/g, '<span style="color: darkorange">$1</span>:')
    .replace(/ "(.*?)"([ ,])/g, ' <span style="color: darkgreen">"$1"</span>$2')

export const logAndAlertError = (error: unknown, prependedMessage?: string) => {
  console.error(error)
  alert((prependedMessage ?? "") + (error instanceof Error ? error.toString() : String(error)))
}
