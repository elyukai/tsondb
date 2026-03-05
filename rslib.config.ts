import { pluginPreact } from "@rsbuild/plugin-preact"
import { defineConfig } from "@rslib/core"

export default defineConfig({
  lib: [
    {
      autoExternal: false,
    },
  ],
  output: {
    distPath: "./dist/src/web",
    target: "web",
    emitCss: false,
    emitAssets: false,
  },
  source: {
    entry: {
      web: "./src/web/index.tsx",
    },
    tsconfigPath: "./src/web/tsconfig.json",
  },
  plugins: [pluginPreact()],
})
