import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/**", "uploads/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // Leading-underscore params are the codebase's existing convention for
      // arguments Express requires positionally but the handler ignores
      // (`_req`, `_next`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Startup and warning logs are deliberate here; stray debug logging is not.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // The one remaining `var` is inside a `declare global` block (the Prisma
      // singleton), which this rule ignores as an ambient declaration — so
      // turning it on costs nothing and catches real `var` use.
      "no-var": "error",
    },
  },
]);
