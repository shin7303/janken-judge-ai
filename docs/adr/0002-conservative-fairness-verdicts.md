# ADR 0002: Conservative fairness verdicts

- Status: Accepted
- Date: 2026-08-01

## Context

A consumer camera observes image frames, not player intent or the moment one player perceives another hand. Frame rate, exposure, occlusion, classification confidence, and hand assignment all introduce uncertainty.

## Decision

Fairness analysis is a deterministic pure function over timestamped observations. It reports evidence-oriented levels and reason codes, never confirmed cheating or misconduct. Missing hands, low confidence, low FPS, crossing, ambiguous assignment, interruption, and unsupported gestures prefer `INSUFFICIENT_DATA` or `INVALID_ROUND` over a definitive result. All decision thresholds live in `domain/round-config.ts`, with named strict, standard, and lenient profiles.

## Consequences

- Every verdict can be reproduced from JSON fixtures and tested without a camera or React.
- Users see the timing evidence and quality limitations behind a result.
- Some playable rounds intentionally produce no definitive winner or fairness conclusion.
