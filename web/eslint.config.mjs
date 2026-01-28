import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import _import from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import { fixupPluginRules } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores(["**/node_modules", "**/build", "**/dist", "**/public", "**/.next"]),
    {
        extends: [
            ...compat.extends("plugin:react/recommended"),
            ...nextCoreWebVitals,
            ...compat.extends("plugin:prettier/recommended")
        ],

        plugins: {
            react,
            "react-hooks": fixupPluginRules(reactHooks),
            "react-refresh": reactRefresh,
            import: fixupPluginRules(_import),
            prettier,
        },

        rules: {
            eqeqeq: "error",
            "no-console": "warn",
            "no-restricted-globals": ["warn", "setTimeout"],
            "prettier/prettier": "error",
            "react/display-name": "off",
            "react/react-in-jsx-scope": "off",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "react/prop-types": "off",
            "react/no-unescaped-entities": "off",
            curly: ["error", "all"],

            "import/order": ["error", {
                groups: ["builtin", "external", "internal", "parent", "sibling", "index"],

                pathGroups: [{
                    pattern: "react",
                    group: "external",
                    position: "before",
                }],

                pathGroupsExcludedImportTypes: ["builtin"],
                "newlines-between": "always",

                alphabetize: {
                    order: "asc",
                    caseInsensitive: true,
                },
            }],
        },
    },
]);