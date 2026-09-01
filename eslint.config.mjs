import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { globalIgnores } from "eslint/config";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
const config = [globalIgnores([".next/**", "node_modules/**", "out/**", "next-env.d.ts"]), ...compat.extends("next/core-web-vitals", "next/typescript")];
export default config;
