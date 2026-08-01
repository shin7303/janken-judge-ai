import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { ROUND_CONFIG } from "@/domain/round-config";
import type { GestureWorkerRequest, GestureWorkerResponse } from "./protocol";

type WorkerContext = {
  onmessage: ((event: MessageEvent<GestureWorkerRequest>) => void) | null;
  postMessage: (message: GestureWorkerResponse) => void;
};

const worker = self as unknown as WorkerContext;
let recognizer: GestureRecognizer | null = null;

const respond = (message: GestureWorkerResponse) => worker.postMessage(message);

worker.onmessage = async ({ data }) => {
  if (data.type === "DISPOSE") {
    recognizer?.close();
    recognizer = null;
    return;
  }
  if (data.type === "INIT") {
    try {
      const fileset = await FilesetResolver.forVisionTasks(data.wasmBaseUrl);
      recognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: data.modelUrl },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: ROUND_CONFIG.minHandDetectionConfidence,
        minHandPresenceConfidence: ROUND_CONFIG.minHandPresenceConfidence,
        minTrackingConfidence: ROUND_CONFIG.minHandTrackingConfidence,
        cannedGesturesClassifierOptions: {
          scoreThreshold: ROUND_CONFIG.modelGestureScoreThreshold,
          categoryAllowlist: ["Closed_Fist", "Open_Palm", "Victory"],
        },
      });
      respond({ type: "READY" });
    } catch (error) {
      respond({
        type: "ERROR",
        code: "WORKER_INIT_FAILED",
        message:
          error instanceof Error ? error.message : "Unknown worker error",
        recoverable: true,
      });
    }
    return;
  }
  if (data.type === "FRAME") {
    if (!recognizer) {
      data.bitmap.close();
      respond({
        type: "ERROR",
        code: "WORKER_NOT_READY",
        message: "Gesture recognizer is not initialized",
        recoverable: true,
      });
      return;
    }
    const startedAt = performance.now();
    try {
      const result = recognizer.recognizeForVideo(
        data.bitmap,
        data.timestampMs,
      );
      respond({
        type: "OBSERVATION",
        frameId: data.frameId,
        timestampMs: data.timestampMs,
        landmarks: result.landmarks.map((hand) =>
          hand.map(({ x, y }) => ({ x, y })),
        ),
        gestures: result.gestures.map((categories) =>
          categories.map(({ categoryName, score }) => ({
            categoryName,
            score,
          })),
        ),
        inferenceDurationMs: performance.now() - startedAt,
      });
    } catch (error) {
      respond({
        type: "ERROR",
        code: "INFERENCE_FAILED",
        message:
          error instanceof Error ? error.message : "Unknown worker error",
        recoverable: true,
      });
    } finally {
      data.bitmap.close();
    }
  }
};
