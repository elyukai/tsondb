import type { FunctionComponent } from "preact"
import type { DialogHTMLAttributes } from "preact/compat"
import { useEffect, useRef } from "preact/hooks"

export const ModalDialog: FunctionComponent<DialogHTMLAttributes> = props => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (ref.current) {
      if (props.open && !ref.current.open) {
        ref.current.showModal()
      } else if (!props.open && ref.current.open) {
        ref.current.close()
      }
    }
  }, [props.open])

  return <dialog {...props} open={undefined} ref={ref} />
}
