import type { FunctionComponent } from "preact"
import type { SerializedStringType } from "../../../shared/schema/types/StringType.ts"
import { validateStringConstraints } from "../../../shared/validation/string.ts"
import { Markdown } from "../../utils/Markdown.tsx"
import { MarkdownHighlighting } from "../../utils/MarkdownHighlighting.tsx"
import type { TypeInputProps } from "./TypeInput.tsx"
import { MismatchingTypeError } from "./utils/MismatchingTypeError.tsx"
import { ValidationErrors } from "./utils/ValidationErrors.tsx"

type Props = TypeInputProps<SerializedStringType, string>

export const StringTypeInput: FunctionComponent<Props> = ({
  type,
  value,
  disabled,
  onChange,
  inTranslationObject,
}) => {
  if (typeof value !== "string") {
    return <MismatchingTypeError expected="string" actual={value} />
  }

  const { minLength, maxLength, pattern, markdown } = type

  const errors = validateStringConstraints(type, value)
  const preparedPattern =
    pattern === undefined
      ? undefined
      : pattern.startsWith("^(?:") && pattern.endsWith(")$")
        ? pattern.slice(4, -2)
        : `.*${pattern}.*`

  return (
    <div class="field field--string">
      {inTranslationObject ? (
        <>
          <div class="editor editor--translation">
            <div class="textarea-grow-wrap">
              <textarea
                rows={1}
                value={value}
                minLength={minLength}
                maxLength={maxLength}
                onInput={event => {
                  onChange(event.currentTarget.value)
                }}
                aria-invalid={errors.length > 0}
                disabled={disabled}
              />
              <div class="textarea-grow-wrap__mirror">{value + " "}</div>
            </div>
            <ValidationErrors disabled={disabled} errors={errors} />
          </div>
        </>
      ) : markdown !== undefined ? (
        <>
          <div class="editor editor--markdown">
            <div class="textarea-grow-wrap">
              <textarea
                rows={1}
                value={value}
                minLength={minLength}
                maxLength={maxLength}
                onInput={event => {
                  onChange(event.currentTarget.value)
                }}
                aria-invalid={errors.length > 0}
                disabled={disabled}
              />
              <p class="help">
                This text field supports{" "}
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
                string={value + " "}
                inline={markdown === "inline"}
              />
            </div>
            <ValidationErrors disabled={disabled} errors={errors} />
          </div>
          <div class="preview">
            <Markdown string={value} outerHeadingLevel={2} inline={markdown === "inline"} />
          </div>
        </>
      ) : (
        <div class="editor">
          <input
            type="text"
            value={value}
            minLength={minLength}
            maxLength={maxLength}
            pattern={preparedPattern}
            onInput={event => {
              onChange(event.currentTarget.value)
            }}
            aria-invalid={errors.length > 0}
            disabled={disabled}
          />
          <ValidationErrors disabled={disabled} errors={errors} />
        </div>
      )}
    </div>
  )
}
