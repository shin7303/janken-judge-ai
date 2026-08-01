# AI development log

## 2026-08-01 — Phase 0: foundation

- Read the product specification and initialized the public GitHub repository.
- Created a Next.js 16 + TypeScript + Tailwind project using pnpm 10.34.5.
- Added a portfolio-oriented Japanese landing page, security headers, metadata, Vitest, React Testing Library, Playwright configuration, Prettier, and GitHub Actions CI.
- Added architecture and limitation documents so the intended client-only privacy model is inspectable from the start.

### Verification

- `lint`, `typecheck`, `test`, `format:check`, and `build` passed locally.

## 2026-08-01 — Deployment routing repair

- Confirmed that `/` returned HTTP 200 in production, while landing-page links to `/demo` and `/play/setup` returned HTTP 404.
- Added explicit, non-misleading progress pages for both routes so visitors can return to the landing page without encountering a dead end.
- Re-ran lint, typecheck, unit tests, and the production build. The build now includes both static routes.
