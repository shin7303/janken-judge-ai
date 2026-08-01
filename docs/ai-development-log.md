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

## 2026-08-01 — Setup readiness diagnostics

- Added a pure setup-readiness evaluator backed by the shared gesture-confidence and minimum-FPS thresholds.
- Reported live camera state, recognized hands, and inference FPS to the setup flow without moving diagnosis logic into the React camera component.
- Added checks for the camera/model, one hand in each player region, gesture confidence, inference performance, and active-tab state.
- Kept navigation to the live round disabled until all five checks pass, with a feature-detected Page Visibility listener and a visible per-condition status list.
- Added unit coverage for ready, duplicate-region, low-confidence, low-FPS, and hidden-tab inputs, plus a component test for gated navigation.

### Failures and fixes

- The first typecheck rejected a readonly test fixture because the evaluator input unnecessarily required a mutable array. Changed the pure function contract to accept readonly observations.
- The first format check found one unformatted component test. Formatted the file and re-ran the complete check set.

### Verification

- `lint`, `typecheck`, `test` (20 tests), `format:check`, `test:e2e`, and `build` passed locally.
- The mobile E2E confirmed that the new diagnostics panel does not introduce horizontal overflow at the covered portrait and landscape sizes.

## 2026-08-01 — Stable player tracking and crossing detection

- Added pure position-based player assignment using landmark centroids, mirrored screen coordinates, prior-frame distance, and centralized ambiguity thresholds.
- Marked same-ROI hands, converged hands, and trajectory crossovers as crossed with zero assignment confidence instead of silently swapping player observations.
- Propagated centroid, assignment confidence, and crossing state into round observations so unreliable tracking produces an invalid result.
- Required all setup checks to remain valid for the configured 500ms stability window before enabling the live round.
- Added tests for normal assignment, same-region and near-center invalidation, trajectory crossover, central ambiguity, crossed setup diagnostics, and the stability delay.

### Failures and fixes

- The first format check found two new tracking files; formatted them before the complete verification run.
- The first stability implementation synchronously reset state inside an effect, which Next.js 16 lint rejects. Reworked the reset and completion transitions to occur through disposable timers.
- A ref-generation alternative passed tests but violated the React rule against reading refs during render. Removed it and retained an explicit instantaneous-readiness guard around the timer state.

### Verification

- `lint`, `typecheck`, `test` (25 tests), `format:check`, `test:e2e`, and `build` passed locally.

## 2026-08-01 — Interruptible live-round state machine

- Replaced ad hoc interval-driven round progress with a pure reducer covering idle, camera-ready, countdown, PON, observing, finalizing, result, and aborted states.
- Gated round start on live camera/model, two-hand, confidence, FPS, and visible-tab diagnostics; duplicate start events are ignored by the reducer.
- Added feature-detected tab visibility interruption and camera-loss interruption while allowing transient gesture or hand misses to flow into conservative quality analysis.
- Recorded explicit missing-hand observations instead of silently omitting a player, preserving evidence for `INSUFFICIENT_DATA`.
- Scoped countdown, PON, observation-deadline, and recorder cleanup to React effect lifetimes so navigation or interruption disposes pending work.
- Revoked the previous replay Object URL before a new round and avoided failing the round when MediaRecorder construction is unavailable.

### Failures and fixes

- The first format check found the rewritten play page and reducer; formatted both before final verification.
- An adversarial pass found that removing the previous replay key before reading it would leak its Object URL. Reordered cleanup to revoke first.
- The same pass found that applying full setup readiness during an active round would abort on a single missed hand. Active rounds now abort only when the camera/model actually stops or the tab becomes hidden; observation quality handles transient misses.

### Verification

- `lint`, `typecheck`, `test` (31 tests), `format:check`, `test:e2e`, and `build` passed locally.

## 2026-08-01 — Reproducible round-analysis fixtures

- Added the seven specification-named JSON fixtures for simultaneous, delayed winning, delayed losing, post-commit switch, low-confidence, crossed-hand, and low-FPS rounds.
- Added an integration suite that loads each fixture from disk and reproduces its winner and conservative fairness verdict through the production analysis function.
- Updated stable-run extraction to tolerate one isolated missing or misclassified frame while requiring a sustained replacement before closing the current gesture.
- Applied the longer configured threshold to post-commit gesture changes and added explicit reason codes for delays, delayed winning hands, and confirmed switches.

### Failures and fixes

- The first integration run resolved `import.meta.url` through Vitest's browser transform and looked for fixtures under `/tests`. Switched to an explicit project-root path for deterministic Node-side fixture loading.
- The crossed-hands fixture initially expected a winner despite zero assignment confidence. Corrected it to `UNDECIDED`, preserving the rule that invalid tracking must not produce a definitive winner.

### Verification

- `lint`, `typecheck`, `test` (40 tests), `format:check`, and `build` passed locally.
