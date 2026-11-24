# @ela-coffee/config

Shared tooling presets for the monorepo. Imported by the root and by
`apps/web` — never edited per-package.

- `tsconfig/base.json` — strict TypeScript base (`strict`, `noImplicitAny`).
  `exactOptionalPropertyTypes` is intentionally left off: it breaks common
  React patterns (e.g. optional props passed as `undefined`) and adds no
  safety the strict flags do not already give.
- `eslint/index.mjs` — flat-config preset extending `eslint-config-next`
  (core-web-vitals + TypeScript).
- `prettier/index.json` — Prettier preset. Choices: `singleQuote: false`
  (double quotes, matching the Next.js / TypeScript ecosystem default),
  `trailingComma: "all"` (cleaner diffs), `printWidth: 100` (a little wider
  than Prettier's 80 default, so long Tailwind class lists do not wrap
  excessively). The root `package.json` points Prettier at this file via
  `"prettier": "@ela-coffee/config/prettier"`.
