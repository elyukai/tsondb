import js from "@eslint/js"
import pluginReact from "eslint-plugin-react"
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores([
    "**/dist/",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: {
      js,
    },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: [
      "eslint.config.js",
    ],
    extends: tseslint.configs.strictTypeChecked,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          allowInterfaces: "with-single-extends",
        },
      ],
      "@typescript-eslint/no-namespace": [
        "error",
        {
          allowDeclarations: true,
        },
      ],
      "@typescript-eslint/prefer-promise-reject-errors": [
        "error",
        {
          allowThrowingUnknown: true,
        }
      ]
    },
  },
  {
    files: ["test/**/*.{js,mjs,cjs,ts,mts,cts}"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    }
  },
  pluginReact.configs.flat.recommended,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
		settings: {
			react: {
				// eslint-plugin-preact interprets this as "h.createElement",
				// however we only care about marking h() as being a used variable.
				pragma: "h",
				// We use "react 16.0" to avoid pushing folks to UNSAFE_ methods.
				version: "16.0",
			}
		},
		rules: {
			"react/react-in-jsx-scope": "off",
      "react/no-unknown-property": ["error", { ignore: ["class"] }],

			"react/prop-types": "off",

			// Legacy APIs not supported in Preact:
			"react/no-did-mount-set-state": "error",
			"react/no-did-update-set-state": "error",
			"react/no-find-dom-node": "error",
			"react/no-is-mounted": "error",
			"react/no-string-refs": "error",
    },
  },
])
