# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the Vue 3 application. Entry wiring lives in `src/main.ts`, routes in `src/router.ts`, shared state in `src/store.ts`, page-level views in `src/pages/`, reusable UI in `src/components/`, and typing logic plus data files in `src/utils/`. Global Less styles live in `src/styles/` and `src/app.less`. Static assets and PWA icons are under `public/`; screenshots used in documentation are in `screenshots/`. One-off data scripts live in `scripts/`.

## Build, Test, and Development Commands
Use Yarn for consistency because the repo includes `yarn.lock`.

- `yarn dev` starts the Vite dev server.
- `yarn build` runs `vue-tsc --noEmit` and then creates the production bundle.
- `yarn preview` serves the built app locally for a final check.
- `yarn lint` runs ESLint on `.ts` and `.vue` files in `src/`.
- `yarn fix` applies auto-fixable lint changes.
- `yarn test` starts Vitest.

## Coding Style & Naming Conventions
Write TypeScript and Vue SFCs with 2-space indentation, double quotes, and trailing commas where the existing code uses them. Keep page components in `src/pages/` with PascalCase names such as `RandomMode.vue`; shared components follow the same pattern. Utility modules use lowercase filenames such as `summary.ts` and JSON config files stay in `src/utils/`. Prefer small, focused modules over large mixed-purpose files.

## Testing Guidelines
Vitest is the test runner. Place tests near the feature they cover, following the existing pattern `src/utils/test/*.test.ts`. Name files `*.test.ts` and keep descriptions specific to the behavior under test. Run `yarn test` before opening a PR; add coverage for changes to typing rules, summary logic, or config parsing.

## Commit & Pull Request Guidelines
Recent history mixes short `fix:` commits with direct update messages. Prefer concise, imperative subjects, ideally with a scope prefix such as `fix:`, `feat:`, or `docs:`. Keep each commit focused. Pull requests should explain the user-visible change, note any config or data-file edits such as `src/utils/spconfig.json`, link related issues, and include screenshots for UI changes. The Husky pre-commit hook runs `yarn lint`, so fix lint failures before pushing.

## Configuration Notes
When adding a new shuangpin scheme, update `src/utils/spconfig.json` and document the source in the PR. Avoid committing generated files unless they are required runtime assets.
