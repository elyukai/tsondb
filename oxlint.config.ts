import config from "@elyukai/oxc-config/linter"
import { defineConfig } from "oxlint"

export default defineConfig({
  extends: [config],
  plugins: ["react"],
  rules: {
    "no-alert": "off",
  },
})
