import type { FunctionComponent } from "preact"
import { useEffect, useRef } from "preact/hooks"
import { LoadingOverlay } from "./LoadingOverlay.tsx"

export const ModalDialog: FunctionComponent<preact.DialogHTMLAttributes> = ({
  children,
  ...props
}) => {
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

  return (
    <dialog {...props} open={undefined} ref={ref}>
      <LoadingOverlay />
      {children}
    </dialog>
  )
}
