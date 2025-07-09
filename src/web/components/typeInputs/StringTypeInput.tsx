import type { FunctionComponent } from "preact"
import type { SerializedStringType } from "../../../node/schema/types/primitives/StringType.js"
import { validateStringConstraints } from "../../../shared/validation/string.js"
import { Markdown } from "./utils/Markdown.js"
import { ValidationErrors } from "./utils/ValidationErrors.js"

type Props = {
  type: SerializedStringType
  value: string
  onChange: (value: string) => void
}

export const StringTypeInput: FunctionComponent<Props> = ({ type, value, onChange }) => {
  const { minLength, maxLength, pattern, isMarkdown } = type

  const errors = validateStringConstraints(type, value)

  return (
    <div class="field field--string">
      {isMarkdown ? (
        <>
          <div className="editor">
            <textarea
              value={value}
              minLength={minLength}
              maxLength={maxLength}
              onInput={event => {
                onChange(event.currentTarget.value)
              }}
              aria-invalid={errors.length > 0}
            />
            <ValidationErrors errors={errors} />
          </div>
          <div className="preview">
            <Markdown string={value} />
          </div>
        </>
      ) : (
        <div className="editor">
          <input
            type="text"
            value={value}
            minLength={minLength}
            maxLength={maxLength}
            pattern={pattern}
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
