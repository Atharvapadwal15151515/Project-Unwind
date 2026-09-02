import js from "@eslint/js";
import globals from "globals";

import reactHooks
  from "eslint-plugin-react-hooks";

import reactRefresh
  from "eslint-plugin-react-refresh";

import {
  defineConfig,
  globalIgnores
} from "eslint/config";


export default defineConfig([
  globalIgnores([
    "dist"
  ]),

  {
    files: [
      "**/*.{js,jsx}"
    ],

    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],

    languageOptions: {
      globals:
        globals.browser,

      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    rules: {
      /*
      |--------------------------------------------------------------------------
      | Existing cleanup debt
      |--------------------------------------------------------------------------
      |
      | Unused values remain visible as warnings.
      | Undefined values and duplicate declarations remain errors.
      |
      */

      "no-unused-vars":
        "warn",

      /*
      |--------------------------------------------------------------------------
      | React 19 migration warnings
      |--------------------------------------------------------------------------
      |
      | These require careful component refactoring.
      | They stay visible without blocking CI for now.
      |
      */

      "react-hooks/set-state-in-effect":
        "warn",

      "react-hooks/immutability":
        "warn",

      "react-hooks/static-components":
        "warn",

      "react-refresh/only-export-components":
        "warn"
    }
  }
]);