# Known limitations

- A consumer camera cannot measure the instant one player sees the other hand, gaze, intent, or deliberate misconduct.
- Commit times are image-recognition estimates affected by FPS, exposure, camera latency, scheduling, and device performance.
- Motion blur, occlusion, overlapping fingers, lighting, patterned backgrounds, gloves, skin contrast, and partial framing can reduce accuracy.
- A fist already visible before PON is difficult to distinguish from a rock gesture intentionally produced at PON.
- Crossing hands, near-center hands, three or more hands, or a single visible hand make player assignment unreliable and intentionally produce a conservative result.
- MediaPipe's built-in gesture model is not trained specifically for competitive rock-paper-scissors.
- Browser support and encoding formats vary. Worker inference, MediaRecorder replay, Web Audio cues, device enumeration, and video-frame callbacks can use reduced-function fallbacks.
- In-memory replay is short-lived and can disappear on navigation, refresh, browser memory pressure, or unsupported recording environments.
- Local history contains result metadata only and can be cleared by the browser or unavailable in restricted privacy modes.
- Heuristic delay thresholds are not scientific proof. The app never confirms cheating and is unsuitable for official competition, discipline, or dispute resolution.

Physical validation is still required on Windows Chrome, macOS Chrome and Safari, Android Chrome, and iPhone Safari before a production release is declared complete.
