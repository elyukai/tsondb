import type { FunctionComponent } from "preact"
import { useContext, useState } from "preact/hooks"
import type { GetAllInstancesOfEntityResponseBody } from "../../shared/api.ts"
import { removeAt, reorder } from "../../shared/utils/array.ts"
import { getLocaleInstances } from "../api/declarations.ts"
import { ConfigContext } from "../context/config.ts"
import { useMappedAPIResource } from "../hooks/useMappedAPIResource.ts"
import { useSetting } from "../hooks/useSettings.ts"
import { ModalDialog } from "./ModalDialog.tsx"
import { Select } from "./Select.tsx"

const localeMapper = (result: GetAllInstancesOfEntityResponseBody) => result.instances

export const Settings: FunctionComponent = () => {
  const [locales, setLocales] = useSetting("displayedLocales")
  const [enumDisplay, setEnumDisplay] = useSetting("enumDisplay")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const config = useContext(ConfigContext)
  const [localeInstances] = useMappedAPIResource(
    getLocaleInstances,
    localeMapper,
    locales,
    config.localeEntityName,
  )
  const [newLocale, setNewLocale] = useState("")

  return (
    <>
      <button
        class="settings-toggle"
        onClick={() => {
          setIsSettingsOpen(true)
        }}
      >
        Settings
      </button>
      <ModalDialog
        open={isSettingsOpen}
        class="settings"
        closedBy="any"
        onClose={() => {
          setIsSettingsOpen(false)
        }}
      >
        <header>
          <h2>Settings</h2>
          <button
            class="close"
            onClick={() => {
              setIsSettingsOpen(false)
            }}
          >
            Close
          </button>
        </header>
        <section class="locale-settings">
          <h3>Display Name Locales</h3>
          <p class="description">
            Define the locales you want to see instances displayed in. Multiple locales can be
            specified as fallback locales. The instances will be grouped by the locale they are
            available in, in the order the locales are specified in.
          </p>
          <ol>
            {locales.length === 0 && (
              <li class="empty" aria-hidden>
                No locales selected
              </li>
            )}
            {locales.map((locale, index) => (
              <li key={locale}>
                <div class="locale-content">
                  <span>
                    {localeInstances?.find(instance => instance.id === locale)?.displayName ??
                      locale}
                  </span>
                  <button
                    onClick={() => {
                      setLocales(locales => reorder(locales, index, index - 1))
                    }}
                    disabled={index === 0}
                  >
                    Move Up
                  </button>
                  <button
                    onClick={() => {
                      setLocales(locales => reorder(locales, index, index + 1))
                    }}
                    disabled={index === locales.length - 1}
                  >
                    Move Down
                  </button>
                  <button
                    onClick={() => {
                      setLocales(locales => removeAt(locales, index))
                    }}
                    disabled={locales.length < 2}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div class="add-item-container">
            <Select
              value={newLocale}
              onInput={event => {
                setNewLocale(event.currentTarget.value)
              }}
              disabled={!localeInstances || localeInstances.length === 0}
            >
              <option value="" disabled>
                {!localeInstances || localeInstances.length === 0
                  ? "No instances available"
                  : "No selected instance"}
              </option>
              {localeInstances
                ?.filter(instance => !locales.includes(instance.id))
                .map(instance => (
                  <option key={instance.id} value={instance.id}>
                    {instance.displayName}
                  </option>
                ))}
            </Select>
            <button
              onClick={() => {
                setLocales(locales => [...locales, newLocale])
                setNewLocale("")
              }}
              disabled={newLocale === ""}
            >
              Add{" "}
              {newLocale === ""
                ? "new locale"
                : (localeInstances?.find(instance => instance.id === newLocale)?.displayName ??
                  newLocale)}
            </button>
          </div>
        </section>
        <section class="locale-settings">
          <h3>Enum Display Mode</h3>
          <p class="description">Choose how enumeration types are displayed.</p>
          <div className="field--option">
            <input
              type="radio"
              name="enum-display"
              id="enum-display-select"
              value="select"
              checked={enumDisplay === "select"}
              onChange={() => {
                setEnumDisplay("select")
              }}
            />
            <label htmlFor="enum-display-select">Select Dropdown</label>
          </div>
          <div className="field--option">
            <input
              type="radio"
              name="enum-display"
              id="enum-display-radio"
              value="radio"
              checked={enumDisplay === "radio"}
              onChange={() => {
                setEnumDisplay("radio")
              }}
            />
            <label htmlFor="enum-display-radio">Radio Buttons</label>
          </div>
        </section>
      </ModalDialog>
    </>
  )
}
