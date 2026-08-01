import type { Point2D } from "@/domain/types";

export type GestureWorkerRequest =
  | { type: "INIT"; modelUrl: string; wasmBaseUrl: string }
  | {
      type: "FRAME";
      frameId: number;
      timestampMs: number;
      bitmap: ImageBitmap;
    }
  | { type: "DISPOSE" };

export type WorkerGesture = { categoryName?: string; score?: number };

export type GestureWorkerResponse =
  | { type: "READY" }
  | {
      type: "OBSERVATION";
      frameId: number;
      timestampMs: number;
      landmarks: Point2D[][];
      gestures: WorkerGesture[][];
      inferenceDurationMs: number;
    }
  | { type: "ERROR"; code: string; message: string; recoverable: boolean };
