const emptyLinePattern = /^ *$$/

export const detectIndentation = (text: string, excludeFirstLineForDetection?: boolean): number => {
  const nonEmptyLines = text.split("\n").filter(line => !emptyLinePattern.test(line))
  return nonEmptyLines[excludeFirstLineForDetection ? 1 : 0]?.match(/^ +/)?.[0].length ?? 0
}

const mapLines = (
  text: string,
  lineMapper: (line: string, index: number, lines: string[]) => string,
): string => text.split("\n").map(lineMapper).join("\n")

export const removeIndentation = (
  text: string,
  excludeFirstLineForDetection?: boolean,
  fixedIndentation?: number,
): string => {
  const indentation = fixedIndentation ?? detectIndentation(text, excludeFirstLineForDetection)
  if (indentation < 1) {
    return text
  }
  const regex = new RegExp(`^ {${indentation.toString()}}`)
  return mapLines(text, line => line.replace(regex, ""))
}
