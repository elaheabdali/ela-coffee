import { defineConfig, globalIgnores } from "eslint/config";
import { baseConfig } from "./packages/config/eslint/index.mjs";

export default defineConfig([
  ...baseConfig,
  globalIgnores(["apps/web/next-env.d.ts", "docs/**", "assets-original/**"]),
]);
