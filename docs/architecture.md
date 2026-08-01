# Architecture

Janken Judge AI is a static, client-only Next.js application designed for Vercel Hobby.

```text
MediaStream camera                         fixed demo fixtures
       │                                          │
       ├── MediaRecorder → session Blob URL       │
       │                                          │
       └── ImageBitmap transfer                   │
                    ▼                             │
          MediaPipe module Worker                 │
          one in-flight + newest pending          │
                    │                             │
                    └──── normalized observations ┘
                                      │
                         pure player assignment
                                      │
                  pure round timing / quality / verdict
                                      │
                    result + timeline + local history
```

## Boundaries

- `app/` and `components/` own routing and presentation.
- `domain/` owns shared types, thresholds, and pure game rules.
- `features/` owns pure analysis and browser-capability adapters.
- `workers/` owns the typed MediaPipe runtime boundary.
- `tests/fixtures/` contains reproducible observation sequences.

The main thread schedules camera frames with `requestVideoFrameCallback` when available and falls back to animation frames. It transfers frames rather than cloning pixels. The Worker queue drops stale pending work, and adaptive quality lowers capture constraints only after repeated low-FPS windows. A detected compatibility path performs inference on the main thread when Worker prerequisites are absent.

Round progression is a reducer with disposable timers. Player assignment uses screen position, previous centroids, ambiguity zones, separation, and crossing trajectories. The final analyzer derives stable runs, commit and switch events, winner, data quality, reason codes, and a conservative fairness verdict.

Video, images, full landmarks, and device labels are never logged or transmitted. Replay Blob URLs and result data live only for the browser session; metadata history and settings stay in localStorage. The application deliberately has no API routes, Server Actions, database, authentication, environment variables, analytics, or external inference APIs.

See [ADR 0001](adr/0001-client-only-worker-inference.md) and [ADR 0002](adr/0002-conservative-fairness-verdicts.md).
