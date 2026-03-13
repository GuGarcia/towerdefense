import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        Bun: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Response: "readonly",
      },
    },
  },
  {
    languageOptions: {
      globals: {
        Bun: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];