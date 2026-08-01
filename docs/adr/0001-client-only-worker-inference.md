# ADR 0001: Client-only Worker inference

- Status: Accepted
- Date: 2026-08-01

## Context

The product must recognize two hands continuously while never transmitting camera video or still images. Inference can block React rendering if it shares the main thread, and camera frame production can outpace model inference.

## Decision

The application is a static Next.js client application with no API routes, backend, authentication, or database. It self-hosts the MediaPipe model and WASM runtime. The main thread transfers `ImageBitmap` frames to a module Worker. A bounded queue permits one in-flight frame and retains only the newest pending frame. Pure tracking and round analysis consume normalized observations outside React components.

When Worker or transferable-frame support is unavailable, feature detection selects a main-thread compatibility mode. All paths dispose streams, recognizers, Workers, callbacks, bitmaps, recorder state, and Object URLs.

## Consequences

- Camera pixels and landmarks remain on the device, and the deployed application can stay static.
- Rendering remains responsive on supported devices and memory cannot grow with an unbounded frame backlog.
- The model and WASM increase the static asset size and require explicit cache headers.
- Browser and device performance vary, so FPS diagnostics, conservative insufficient-data results, and physical-device verification remain necessary.
