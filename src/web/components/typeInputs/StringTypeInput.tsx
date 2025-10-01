import type { FunctionComponent } from "preact"
import type { SerializedStringType } from "../../../shared/schema/types/StringType.ts"
import { validateStringConstraints } from "../../../shared/validation/string.ts"
import { Markdown } from "../../utils/Markdown.tsx"
import { MarkdownHighlighting } from "../../utils/MarkdownHighlighting.tsx"
import type { TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedStringType, string>

export const StringTypeInput: FunctionComponent<Props> = ({ type, value, onChange }) => {
  if (typeof value !== "string") {
    return <MismatchingTypeError expected="string" actual={value} />
  }

  const { minLength, maxLength, pattern, isMarkdown } = type

  const errors = validateStringConstraints(type, value)

  return (
    <div class="field field--string">
      {isMarkdown ? (
        <>
          <div class="editor editor--markdown">
            <div class="textarea-grow-wrap">
              <textarea
                value={value}
                minLength={minLength}
                maxLength={maxLength}
                onInput={event => {
                  onChange(event.currentTarget.value)
                }}
                aria-invalid={errors.length > 0}
              />
              <p class="help">
                This textarea supports{" "}
                <a
                  href="https://www.markdownguide.org/getting-started/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Markdown
                </a>
                .
              </p>
              <MarkdownHighlighting
                class="textarea-grow-wrap__mirror editor-highlighting"
                string={value}
              />
            </div>
            <ValidationErrors errors={errors} />
          </div>
          <div class="preview">
            <Markdown string={value} />
          </div>
        </>
      ) : (
        <div class="editor">
          <input
            type="text"
            value={value}
            minLength={minLength}
            maxLength={maxLength}
            pattern={
              pattern === undefined
                ? undefined
                : pattern.startsWith("^(?:") && pattern.endsWith(")$")
                  ? pattern.slice(4, -2)
                  : `.*${pattern}.*`
            }
            onInput={event => {
              onChange(event.currentTarget.value)
            }}
            aria-invalid={errors.length > 0}
          />
          <ValidationErrors errors={errors} />
        </div>
      )}
    </div>
  )
}
