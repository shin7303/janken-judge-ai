# Architecture

Janken Judge AI is a static, client-first Next.js application intended for Vercel Hobby.

```text
Camera / demo fixture
        ↓
MediaPipe gesture worker → normalized observations → round domain logic
        ↓                         ↓                       ↓
Canvas / live UI            quality metrics         result, replay, history
```

- The UI lives in `app/` and `components/`.
- Pure game, fairness, quality, and gesture code will live in `domain/` and `features/`.
- The MediaPipe worker will accept only the newest available frame, preventing an unbounded queue.
- Video, landmarks, and frames remain in the browser. Only a small metadata history is retained locally.

The application deliberately has no API routes, Server Actions, database, authentication, or environment variables.
