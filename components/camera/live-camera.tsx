"use client";

import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROUND_CONFIG } from "@/domain/round-config";
import type { Gesture, PlayerId, Point2D } from "@/domain/types";
import {
  initialAdaptiveQuality,
  updateAdaptiveQuality,
  type AdaptiveQualityState,
} from "@/features/camera/adaptive-quality";
import { blendGesture } from "@/features/gesture/classify-landmarks";
import { LatestFrameQueue } from "@/features/gesture/latest-frame-queue";
import {
  assignHandsToPlayers,
  type PlayerTrackingState,
} from "@/features/player-tracking/assign-hands";
import type {
  GestureWorkerRequest,
  GestureWorkerResponse,
  WorkerGesture,
} from "@/workers/protocol";

export type LiveHand = {
  player: PlayerId;
  gesture: Gesture;
  score: number;
  timestampMs: number;
  centroid: Point2D;
  assignmentConfidence: number;
  crossed: boolean;
};
export type LiveCameraDiagnostics = {
  running: boolean;
  fps: number;
  inferenceMs: number;
  executionMode: "worker" | "main-thread" | null;
  qualityProfile: AdaptiveQualityState["profile"];
  hands: LiveHand[];
};
type Hand = LiveHand & { label: string };
type WorkerFrame = {
  frameId: number;
  timestampMs: number;
  bitmap: ImageBitmap;
};
const gestureNames = {
  ROCK: "グー",
  PAPER: "パー",
  SCISSORS: "チョキ",
  UNKNOWN: "認識中",
} as const;
const wasmUrl = "/mediapipe/wasm";

export function LiveCamera({
  onFrame,
  onStream,
  onDiagnostics,
  mirrored = true,
}: {
  onFrame?: (hands: LiveHand[]) => void;
  onStream?: (stream: MediaStream) => void;
  onDiagnostics?: (diagnostics: LiveCameraDiagnostics) => void;
  mirrored?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerQueueRef = useRef<LatestFrameQueue<WorkerFrame> | null>(null);
  const workerInitResolveRef = useRef<((ready: boolean) => void) | null>(null);
  const frameRef = useRef<number | null>(null);
  const frameSchedulerRef = useRef<"video" | "animation">("animation");
  const captureBusyRef = useRef(false);
  const adaptiveQualityRef = useRef<AdaptiveQualityState>(
    initialAdaptiveQuality,
  );
  const streamRef = useRef<MediaStream | null>(null);
  const operationRef = useRef(0);
  const trackingRef = useRef<PlayerTrackingState>({});
  const [status, setStatus] = useState("カメラを開始してください");
  const [hands, setHands] = useState<Hand[]>([]);
  const [fps, setFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [executionMode, setExecutionMode] =
    useState<LiveCameraDiagnostics["executionMode"]>(null);
  const [qualityProfile, setQualityProfile] =
    useState<AdaptiveQualityState["profile"]>("standard");
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    onDiagnostics?.({
      running: active,
      fps,
      inferenceMs,
      executionMode,
      qualityProfile,
      hands,
    });
  }, [
    active,
    executionMode,
    fps,
    hands,
    inferenceMs,
    onDiagnostics,
    qualityProfile,
  ]);
  const release = useCallback(() => {
    operationRef.current += 1;
    workerInitResolveRef.current?.(false);
    workerInitResolveRef.current = null;
    if (frameRef.current) {
      if (
        frameSchedulerRef.current === "video" &&
        videoRef.current?.cancelVideoFrameCallback
      )
        videoRef.current.cancelVideoFrameCallback(frameRef.current);
      else cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = null;
    captureBusyRef.current = false;
    workerQueueRef.current?.dispose();
    workerQueueRef.current = null;
    workerRef.current?.postMessage({
      type: "DISPOSE",
    } satisfies GestureWorkerRequest);
    workerRef.current?.terminate();
    workerRef.current = null;
    recognizerRef.current?.close();
    recognizerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackingRef.current = {};
    adaptiveQualityRef.current = initialAdaptiveQuality;
  }, []);
  const stop = useCallback(() => {
    release();
    setHands([]);
    setFps(0);
    setInferenceMs(0);
    setExecutionMode(null);
    setQualityProfile("standard");
    setActive(false);
    setStarting(false);
    setStatus("カメラを停止しました。再開できます。");
  }, [release]);
  useEffect(() => release, [release]);
  const start = async () => {
    if (active || starting) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(
        "このブラウザではカメラを利用できません。対応ブラウザで開くか、デモをお試しください。",
      );
      return;
    }
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    try {
      setStarting(true);
      setStatus("カメラとモデルを読み込んでいます…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
      if (operationRef.current !== operation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) =>
        track.addEventListener(
          "ended",
          () => {
            if (operationRef.current !== operation) return;
            release();
            setHands([]);
            setFps(0);
            setInferenceMs(0);
            setExecutionMode(null);
            setQualityProfile("standard");
            setActive(false);
            setStarting(false);
            setStatus(
              "カメラが切断されました。接続を確認して再開してください。",
            );
          },
          { once: true },
        ),
      );
      onStream?.(stream);
      if (!videoRef.current) {
        release();
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (operationRef.current !== operation) return;
      let count = 0;
      let measuredSince = performance.now();
      const publish = (
        landmarks: Point2D[][],
        gestures: WorkerGesture[][],
        timestampMs: number,
        durationMs: number,
      ) => {
        const detections = landmarks.map((points, index) => {
          const category = gestures[index]?.[0];
          const classification = blendGesture(
            category?.categoryName,
            category?.score ?? 0,
            points,
          );
          const centroid = points.reduce(
            (sum, point) => ({
              x: sum.x + (mirrored ? 1 - point.x : point.x) / points.length,
              y: sum.y + point.y / points.length,
            }),
            { x: 0, y: 0 },
          );
          return {
            centroid,
            gesture: classification.gesture,
            label: gestureNames[classification.gesture],
            score: classification.score,
            timestampMs,
          };
        });
        const assigned = assignHandsToPlayers(detections, trackingRef.current);
        trackingRef.current = assigned.next;
        const found: Hand[] = assigned.hands.sort((a, b) =>
          a.player.localeCompare(b.player),
        );
        setHands(found);
        setInferenceMs(Number(durationMs.toFixed(1)));
        onFrame?.(found);
        count += 1;
        const now = performance.now();
        if (now - measuredSince >= 1000) {
          const measuredFps = Math.round(
            (count * 1000) / (now - measuredSince),
          );
          setFps(measuredFps);
          const previousQuality = adaptiveQualityRef.current;
          const nextQuality = updateAdaptiveQuality(
            previousQuality,
            measuredFps,
          );
          adaptiveQualityRef.current = nextQuality;
          if (
            previousQuality.profile !== nextQuality.profile &&
            nextQuality.profile === "reduced"
          ) {
            setQualityProfile("reduced");
            const track = streamRef.current?.getVideoTracks()[0];
            if (track?.applyConstraints)
              void track
                .applyConstraints({
                  width: { ideal: ROUND_CONFIG.reducedVideoWidth },
                  height: { ideal: ROUND_CONFIG.reducedVideoHeight },
                })
                .then(() => {
                  if (operationRef.current === operation)
                    setStatus(
                      "推論速度を保つため、カメラ解像度を自動調整しました。",
                    );
                })
                .catch(() => {
                  if (operationRef.current === operation)
                    setStatus(
                      "推論FPSが低いため、判定不能になる場合があります。",
                    );
                });
          }
          count = 0;
          measuredSince = now;
        }
      };

      let workerReady = false;
      if (
        typeof Worker !== "undefined" &&
        typeof createImageBitmap === "function"
      ) {
        const worker = new Worker(
          new URL("../../workers/gesture.worker.ts", import.meta.url),
          { type: "module" },
        );
        workerRef.current = worker;
        workerReady = await new Promise<boolean>((resolve) => {
          let settled = false;
          const settle = (ready: boolean) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            workerInitResolveRef.current = null;
            resolve(ready);
          };
          workerInitResolveRef.current = settle;
          const timeout = window.setTimeout(
            () => settle(false),
            ROUND_CONFIG.workerInitTimeoutMs,
          );
          worker.onmessage = ({ data }: MessageEvent<GestureWorkerResponse>) =>
            settle(data.type === "READY");
          worker.onerror = () => settle(false);
          worker.postMessage({
            type: "INIT",
            modelUrl: "/models/gesture-recognizer-v1.task",
            wasmBaseUrl: wasmUrl,
          } satisfies GestureWorkerRequest);
        });
        if (!workerReady) {
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
        }
      }
      if (operationRef.current !== operation) return;

      if (workerReady && workerRef.current) {
        const worker = workerRef.current;
        const queue = new LatestFrameQueue<WorkerFrame>((frame) => {
          worker.postMessage(
            {
              type: "FRAME",
              frameId: frame.frameId,
              timestampMs: frame.timestampMs,
              bitmap: frame.bitmap,
            } satisfies GestureWorkerRequest,
            [frame.bitmap],
          );
        });
        workerQueueRef.current = queue;
        worker.onmessage = ({ data }: MessageEvent<GestureWorkerResponse>) => {
          if (data.type === "OBSERVATION") {
            publish(
              data.landmarks,
              data.gestures,
              data.timestampMs,
              data.inferenceDurationMs,
            );
            queue.complete();
          } else if (data.type === "ERROR") {
            queue.complete();
            release();
            setHands([]);
            setFps(0);
            setInferenceMs(0);
            setActive(false);
            setStarting(false);
            setExecutionMode(null);
            setQualityProfile("standard");
            setStatus(
              "推論処理でエラーが発生しました。カメラを再開してください。",
            );
          }
        };
        worker.onerror = () => {
          release();
          setHands([]);
          setFps(0);
          setInferenceMs(0);
          setActive(false);
          setStarting(false);
          setExecutionMode(null);
          setQualityProfile("standard");
          setStatus("推論Workerが停止しました。カメラを再開してください。");
        };
        setExecutionMode("worker");
      } else {
        const fileset = await FilesetResolver.forVisionTasks(wasmUrl);
        if (operationRef.current !== operation) return;
        const recognizer = await GestureRecognizer.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/gesture-recognizer-v1.task" },
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
        if (operationRef.current !== operation) {
          recognizer.close();
          return;
        }
        recognizerRef.current = recognizer;
        setExecutionMode("main-thread");
      }
      setActive(true);
      setStarting(false);
      setStatus(
        workerReady
          ? "二人の手を左右の枠に入れてください"
          : "互換モードで実行中です。二人の手を左右の枠に入れてください",
      );
      let last = 0;
      let frameId = 0;
      let lastVideoTime = -1;
      const schedule = (callback: () => void) => {
        const video = videoRef.current;
        if (video?.requestVideoFrameCallback) {
          frameSchedulerRef.current = "video";
          frameRef.current = video.requestVideoFrameCallback(() => callback());
        } else {
          frameSchedulerRef.current = "animation";
          frameRef.current = requestAnimationFrame(callback);
        }
      };
      const loop = () => {
        const video = videoRef.current;
        if (!video || operationRef.current !== operation) return;
        const now = performance.now();
        if (
          now - last >= ROUND_CONFIG.inferenceIntervalMs &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.currentTime !== lastVideoTime
        ) {
          last = now;
          lastVideoTime = video.currentTime;
          if (workerQueueRef.current && !captureBusyRef.current) {
            captureBusyRef.current = true;
            frameId += 1;
            void createImageBitmap(video)
              .then((bitmap) => {
                if (operationRef.current !== operation) {
                  bitmap.close();
                  return;
                }
                workerQueueRef.current?.submit({
                  frameId,
                  timestampMs: now,
                  bitmap,
                });
              })
              .catch(() => {})
              .finally(() => {
                captureBusyRef.current = false;
              });
          } else if (recognizerRef.current) {
            const inferenceStarted = performance.now();
            const result = recognizerRef.current.recognizeForVideo(video, now);
            publish(
              result.landmarks,
              result.gestures,
              now,
              performance.now() - inferenceStarted,
            );
          }
        }
        schedule(loop);
      };
      schedule(loop);
    } catch (error) {
      if (operationRef.current !== operation) return;
      release();
      setHands([]);
      setFps(0);
      setInferenceMs(0);
      setExecutionMode(null);
      setQualityProfile("standard");
      setActive(false);
      setStarting(false);
      setStatus(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "カメラ権限が拒否されました。ブラウザ設定を確認してください。"
          : "カメラまたはモデルを開始できませんでした。もう一度お試しください。",
      );
    }
  };
  return (
    <section className="camera-shell">
      <div className="camera-stage">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`camera-video${mirrored ? "" : " unmirrored"}`}
        />
        <div className="roi roi-a">PLAYER A</div>
        <div className="roi roi-b">PLAYER B</div>
        {!active && <div className="camera-empty">CAMERA OFF</div>}
      </div>
      <div className="camera-toolbar">
        <div>
          <b>状態</b>
          <span role="status" aria-live="polite">
            {status}
          </span>
        </div>
        <div>
          <b>推論性能</b>
          <span>
            {fps ? `${fps} FPS` : "—"}
            {inferenceMs ? ` / ${inferenceMs}ms` : ""}
            {executionMode === "worker"
              ? " / Worker"
              : executionMode === "main-thread"
                ? " / 互換モード"
                : ""}
            {qualityProfile === "reduced" ? " / 低解像度" : ""}
          </span>
        </div>
      </div>
      <div className="hand-readings">
        {(["PLAYER_A", "PLAYER_B"] as const).map((player) => {
          const hand = hands.find((item) => item.player === player);
          return (
            <div key={player}>
              <span>{player}</span>
              <b>{hand?.label ?? "手を検出中"}</b>
              <small>
                {hand ? `信頼度 ${Math.round(hand.score * 100)}%` : "—"}
              </small>
            </div>
          );
        })}
      </div>
      <div className="camera-actions">
        <button
          className="button button-primary"
          onClick={start}
          disabled={active || starting}
        >
          {starting ? "準備中…" : active ? "カメラ使用中" : "カメラを開始 →"}
        </button>
        <button
          className="button button-secondary"
          onClick={stop}
          disabled={!active && !starting}
        >
          停止
        </button>
      </div>
      <p className="orientation-hint">
        <span aria-hidden="true">↻</span>
        スマートフォンは横向きにすると、二人の手を大きく映せます。
      </p>
      <p className="camera-privacy">
        映像はこの端末内で処理され、サーバーへ送信されません。マイクは使用しません。
      </p>
    </section>
  );
}
