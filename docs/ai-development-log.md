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

## 2026-08-01 — Time-series judging domain

- Added framework-independent domain types and the round timing configuration.
- Implemented pure winner, stable-gesture, quality, delayed-commitment, and post-commit switch logic.
- Added unit tests for draws, all winner directions, review and likely-late thresholds, delayed losing hands, switches, and crossed-hand invalidation.

## 2026-08-01 — Interactive demo

- Replaced the placeholder demo route with selectable fixed scenarios backed by the same pure round-analysis logic used by the app.
- Displayed final gestures, winner, commitment delay, quality, reason codes, and a compact event timeline.

## 2026-08-01 — Live camera recognition

- Added an explicit user-initiated camera flow with no microphone request.
- Bundled the MediaPipe Gesture Recognizer model as a versioned static asset and configured two-hand VIDEO recognition.
- Assigned players by horizontal landmark position and displayed live gesture, confidence, and inference FPS.
- Stopped tracks and disposed the recognizer when the user stops the camera or leaves the page.
- Added a landmark-based fallback classifier and blended it with the model score; mirrored display coordinates are converted before player assignment.

## 2026-08-01 — Live round flow

- Connected live observations to a 3, 2, 1 countdown and captured the PON timestamp with `performance.now()`.
- Added `/play` and `/play/result`; the round collects a bounded observation buffer, runs the pure time-series analysis after the deadline, and displays the result locally.

## 2026-08-01 — Mobile usability and camera resilience

- Made the primary screens fit narrow portrait and short landscape viewports, including safe-area padding, responsive typography, horizontally scrollable demo scenarios, and a stable 4:3 camera preview.
- Increased interactive target sizes, added visible keyboard focus styles and a live camera status announcement, and included a mobile landscape hint.
- Added feature detection with a user-facing fallback when the camera API is unavailable.
- Prevented duplicate camera starts and invalidated asynchronous startup work when the user stops or leaves, including disposal of a stream that resolves after cancellation.
- Added a Playwright regression covering five primary routes at 320×568, 390×844, and 844×390, plus unit coverage for the camera fallback and startup cancellation cleanup.

### Failures and fixes

- The first command could not find the `pnpm` executable in the shell PATH; subsequent verification used the project-pinned pnpm 10.34.5 through Corepack.
- Vitest initially collected the new Playwright spec and failed because Playwright's `test()` cannot run inside Vitest. Restricted Vitest discovery to `tests/unit`.
- Prettier initially reported the package-manager-generated `pnpm-lock.yaml`; excluded the generated lockfile from formatting checks.
- The first camera cancellation unit test exposed missing test cleanup and an intentionally partial `MediaStream` mock type. Added explicit component cleanup and narrowed the mock cast.

### Verification

- `lint`, `typecheck`, `test` (16 unit tests), `format:check`, `test:e2e`, and `build` passed locally.
- The production build prerendered `/`, `/demo`, `/history`, `/play`, `/play/result`, and `/play/setup` successfully.
