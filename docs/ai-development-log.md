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

## 2026-08-01 — Worker inference and adaptive performance

- Moved MediaPipe recognition to a module Web Worker using transferable `ImageBitmap` frames and typed INIT/FRAME/DISPOSE and READY/OBSERVATION/ERROR messages.
- Added a tested latest-frame queue that permits one in-flight frame, retains only the newest pending frame, and closes replaced or disposed bitmaps.
- Preferred `requestVideoFrameCallback`, detected duplicate video timestamps, capped capture at the centralized inference interval, and retained a detected main-thread compatibility fallback.
- Added worker initialization timeout, runtime recovery messaging, camera-disconnection handling, and disposal for callbacks, queued frames, recognizers, Workers, streams, and pending initialization.
- Added inference duration, execution mode, FPS, and reduced-resolution status to the camera diagnostics.
- Added a pure adaptive-quality controller that lowers capture constraints to 480×360 only after three consecutive low-FPS windows.
- Moved MediaPipe and landmark decision thresholds into the shared configuration module.
- Self-hosted the version-matched SIMD and non-SIMD MediaPipe WASM loaders/binaries and added immutable model/runtime cache headers, removing the runtime CDN dependency.
- Added a browser E2E with deterministic MediaStream, video-frame, ImageBitmap, and Worker doubles to verify start, protocol wiring, and stop cleanup.

### Failures and fixes

- The first Worker build verification passed, but an adversarial fake-camera E2E exposed that Next dev rejected the test's `127.0.0.1` origin. Added the loopback host to Next's development-only `allowedDevOrigins` configuration.
- Chromium's command-line fake camera granted permission but never resolved a stream in this environment. A Canvas stream progressed further, but real MediaPipe WASM caused the constrained headless renderer to become unresponsive in both dev and production modes.
- Replaced that unstable environment-dependent test with deterministic browser doubles while retaining production bundling and pure queue tests. Real MediaPipe Worker execution remains an explicit physical-device verification item.
- Copying the versioned Emscripten loaders caused ESLint to inspect third-party generated code. Excluded only `public/mediapipe/**` from lint and formatting while continuing to build and serve it.

### Verification

- `lint`, `typecheck`, `test` (44 tests), `format:check`, `test:e2e` (2 browser tests), and `build` passed locally.

## 2026-08-01 — Replay controls and evidence timeline

- Added portable MediaRecorder option selection with browser-default fallback and non-fatal messages for unsupported, failed, or empty recordings.
- Stored the recording-to-PON offset with the local Blob URL so replay controls can seek to PON, each commitment, and post-commit switch events.
- Added 0.25×, 0.5×, and 1× playback controls and a pure timeline marker generator covering the observation start, PON, both commitments, switches, and deadline.
- Kept the evidence timeline and explicit fallback reason available when replay recording is unavailable.
- Revoked previous replay Object URLs before new rounds and on result-page exit, while removing replay metadata from session storage.
- Made corrupted result and replay metadata fail closed instead of crashing the result route.
- Added tests for format selection, metadata validation/cleanup, timeline positions, playback speed, seeking, and replay-less fallback.

### Failures and fixes

- The first typecheck rejected a deliberately partial `RoundResult` in the ReplayPlayer test. Replaced it with a complete type-checked fixture rather than weakening production types.

### Verification

- `lint`, `typecheck`, `test` (51 tests), `format:check`, `test:e2e` (2 browser tests), and `build` passed locally.

## 2026-08-01 — Local play settings and countdown audio

- Added locally persisted strict, standard, and lenient sensitivity profiles backed by the shared threshold configuration.
- Added setup controls for sensitivity, replay recording, mirrored preview, countdown volume, and restoring defaults.
- Applied the selected thresholds consistently to setup readiness and final round analysis.
- Applied mirrored coordinates and presentation together so player assignment remains aligned with the visible ROIs.
- Added feature-detected Web Audio countdown cues with muted fallback and lifecycle cleanup; recording remains optional and local-only.
- Added defensive parsing and clamping tests for corrupted or out-of-range stored settings.

### Failures and fixes

- The first verification command used an unavailable standalone `pnpm` executable. Re-ran every check through the repository-pinned `corepack pnpm` version.

### Verification

- `lint`, `typecheck`, `test` (53 tests), `test:e2e` (2 browser tests), and `build` passed locally.

## 2026-08-01 — Camera selection and local brightness diagnostics

- Enumerated available video inputs only through feature-detected browser APIs after permission, presented labeled camera choices, and handled device connection changes with listener cleanup.
- Applied an explicitly selected device on the next camera start while retaining automatic front-camera selection as the portable fallback.
- Sampled a 16×12 in-memory Canvas once per diagnostics window to estimate luminance without retaining or transmitting an image.
- Added clear dark, usable, over-bright, and unavailable brightness states plus pure luminance tests.
- Extended the deterministic camera E2E to verify that enumerated devices reach the setup UI.

### Verification

- `lint`, `typecheck`, `test` (55 tests), `test:e2e` (2 browser tests), and `build` passed locally.

## 2026-08-01 — Portfolio documentation and complete browser flows

- Replaced the phase-zero README with the required product overview, public URL, features, stack, architecture, verdict logic, privacy guarantees, setup, test and deploy instructions, limitations, Codex workflow, license status, and roadmap.
- Added current architecture and limitations documents plus ADRs for client-only Worker inference and conservative fairness verdicts.
- Generated a portfolio Open Graph visual, connected it through the Next.js 16 metadata file convention, and added Japanese alternative text and the verified Production metadata base.
- Extended CI with formatting and Playwright checks, including Chromium installation.
- Added browser flows for landing-to-demo navigation, normal and delayed demo evidence, camera denial and retry, settings persistence and reset, replay fallback, history save/delete, and result-to-rematch navigation.
- Hardened history parsing, capacity, export, deletion, random-ID fallback, and blocked-storage behavior with unit coverage.

### Failures and fixes

- Prettier cannot infer a parser for Next's `opengraph-image.alt.txt`; excluded that framework metadata text file from formatting while retaining its contents.
- The first product-flow test expected a non-existent internal reason-code name and used a stale replay key. Switched both to production constants and the actual evidence code.
- Interrupted screenshot attempts left a development server alive; a later E2E run reused it and timed out during navigation. Terminated the owned process and confirmed all six tests against a clean server.
- Both the Playwright screenshot CLI and `page.screenshot` stopped in the constrained headless renderer. Kept the generated OGP visual as the README preview and left a real-device product capture as a release checklist item.
- A proposed Playwright `reducedMotion` config field was not supported by the installed type definitions. Removed it and used deterministic DOM activation for the affected navigation checks.

## 2026-08-01 — Adversarial browser-lifecycle hardening

- Wrapped session storage reads, writes, and removal so restricted privacy modes cannot prevent result navigation or replay fallback.
- Revoked a newly created replay Object URL when storage rejects it, feature-detected URL creation, and closed countdown audio on recorder completion.
- Made replay cleanup best-effort when storage or URL APIs throw.
- Retained an in-memory settings snapshot when localStorage is blocked and still notified the live UI.
- Centralized countdown, display, observation capacity, ROI, brightness, and landmark-classification heuristics alongside all existing decision thresholds.
- Removed the hover translation that could make edge-of-button pointer activation oscillate.
- Added safe-storage and malformed-history tests.

### Failures and fixes

- Typecheck caught the unsupported Playwright config option described above before it could enter CI.
- The first production build with the file-convention OGP emitted a missing `metadataBase` warning. Verified the existing Vercel Production URL before adding it rather than inventing a host.

### Verification

- `format:check`, `lint`, `typecheck`, `test` (61 tests), `test:e2e` (6 browser tests), and `build` passed locally after clean-process verification.

## 2026-08-01 — Production deployment verification

- Deployed the committed application to the existing Vercel project and aliased the ready deployment to `https://janken-judge-ai.vercel.app`.
- Confirmed HTTP 200 responses for `/`, `/demo`, `/play/setup`, and `/opengraph-image.png` on the production alias.
- Confirmed `Permissions-Policy: camera=(self), microphone=()`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` on the public HTML response.
- Confirmed immutable one-year caching for the self-hosted gesture model.
- Confirmed absolute Open Graph and Twitter image metadata resolves to the production alias, including image dimensions and Japanese product metadata.

### Remaining physical-device verification

- Real MediaPipe camera inference, recording formats, camera stop indicators, audio, and layout still require manual checks on Windows Chrome, macOS Chrome/Safari, Android Chrome, and iPhone Safari. These cannot be truthfully simulated as completed by the current headless environment.
- A real product screenshot remains part of that physical release pass because both supported headless screenshot paths stopped in the constrained renderer; the generated OGP visual is used as the current repository preview.

## 2026-08-01 — Second adversarial audit: production dependencies

- Confirmed the self-hosted 8MB model and 23MB MediaPipe WASM runtime are tracked in Git and available to deployment rather than only present in the local workspace.
- Re-scanned application and Worker sources for external frame transmission, secrets, and unbounded browser-resource creation; no new application-code finding remained.
- Ran a production dependency audit, which reported three high and one moderate advisory through Next.js transitive packages.
- Excluded the vulnerable optional `sharp` package because the application does not use dynamic Next image optimization, and overrode Next's pinned PostCSS with compatible patched version 8.5.25.

### Failures and fixes

- The first `pnpm audit --prod` reported inherited libvips issues in `sharp` below 0.35 and source-map/stringification issues in older PostCSS. Updated the workspace install policy and lockfile, then repeated the audit and the complete verification suite.

### Verification

- `pnpm audit --prod` reports no known vulnerabilities.
- `format:check`, `lint`, `typecheck`, `test` (61 tests), `test:e2e` (6 browser tests), and `build` pass without the optional image optimizer.
