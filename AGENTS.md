# Project Rules

`docs/specification.md` is the single source of product requirements.

1. Break the target phase into small tasks before implementation.
2. Do not add a backend, authentication, database, or external API unless the specification changes.
3. Never send camera video or still images over the network.
4. Keep domain logic outside React components; fairness logic must be pure and tested.
5. Keep decision thresholds in one configuration module.
6. Add tests for every new feature.
7. Run lint, typecheck, test, and build after implementation; record failures and fixes in `docs/ai-development-log.md`.
8. Browser APIs require feature detection and a fallback.
9. Dispose MediaStreams, Workers, and Object URLs.
10. Prefer `INSUFFICIENT_DATA` over a definitive claim when observations are unreliable.
11. Do not describe a result as confirmed cheating or misconduct.
12. Keep commits small and aligned to a user-visible capability or an independently verifiable foundation.

## Next.js 16

This project uses Next.js 16. Read the relevant guide in `node_modules/next/dist/docs/` before using unfamiliar framework APIs and follow deprecation notices.
