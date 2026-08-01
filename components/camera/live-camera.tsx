"use client";

import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { blendGesture } from "@/features/gesture/classify-landmarks";
import {
  assignHandsToPlayers,
  type PlayerTrackingState,
} from "@/features/player-tracking/assign-hands";
import type { Gesture, PlayerId, Point2D } from "@/domain/types";

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
  hands: LiveHand[];
};
type Hand = LiveHand & { label: string };
const gestureNames = {
  ROCK: "グー",
  PAPER: "パー",
  SCISSORS: "チョキ",
  UNKNOWN: "認識中",
} as const;
const wasmUrl =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

export function LiveCamera({
  onFrame,
  onStream,
  onDiagnostics,
}: {
  onFrame?: (hands: LiveHand[]) => void;
  onStream?: (stream: MediaStream) => void;
  onDiagnostics?: (diagnostics: LiveCameraDiagnostics) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const operationRef = useRef(0);
  const trackingRef = useRef<PlayerTrackingState>({});
  const [status, setStatus] = useState("カメラを開始してください");
  const [hands, setHands] = useState<Hand[]>([]);
  const [fps, setFps] = useState(0);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    onDiagnostics?.({ running: active, fps, hands });
  }, [active, fps, hands, onDiagnostics]);
  const release = useCallback(() => {
    operationRef.current += 1;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    recognizerRef.current?.close();
    recognizerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackingRef.current = {};
  }, []);
  const stop = useCallback(() => {
    release();
    setHands([]);
    setFps(0);
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
      onStream?.(stream);
      if (!videoRef.current) {
        release();
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (operationRef.current !== operation) return;
      const fileset = await FilesetResolver.forVisionTasks(wasmUrl);
      if (operationRef.current !== operation) return;
      const recognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/models/gesture-recognizer-v1.task" },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        cannedGesturesClassifierOptions: {
          scoreThreshold: 0.6,
          categoryAllowlist: ["Closed_Fist", "Open_Palm", "Victory"],
        },
      });
      if (operationRef.current !== operation) {
        recognizer.close();
        return;
      }
      recognizerRef.current = recognizer;
      setActive(true);
      setStarting(false);
      setStatus("二人の手を左右の枠に入れてください");
      let last = 0;
      let count = 0;
      let started = performance.now();
      const loop = () => {
        const video = videoRef.current;
        if (!video || !recognizerRef.current) return;
        const now = performance.now();
        if (
          now - last >= 50 &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          last = now;
          const result = recognizerRef.current.recognizeForVideo(video, now);
          const detections = result.landmarks.map((points, index) => {
            const category = result.gestures[index]?.[0];
            const classification = blendGesture(
              category?.categoryName,
              category?.score ?? 0,
              points,
            );
            const centroid = points.reduce(
              (sum, point) => ({
                x: sum.x + (1 - point.x) / points.length,
                y: sum.y + point.y / points.length,
              }),
              { x: 0, y: 0 },
            );
            return {
              centroid,
              gesture: classification.gesture,
              label: gestureNames[classification.gesture],
              score: classification.score,
              timestampMs: now,
            };
          });
          const assigned = assignHandsToPlayers(
            detections,
            trackingRef.current,
          );
          trackingRef.current = assigned.next;
          const found: Hand[] = assigned.hands.sort((a, b) =>
            a.player.localeCompare(b.player),
          );
          setHands(found);
          onFrame?.(found);
          count += 1;
          if (now - started >= 1000) {
            setFps(count);
            count = 0;
            started = now;
          }
        }
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch (error) {
      if (operationRef.current !== operation) return;
      release();
      setHands([]);
      setFps(0);
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
        <video ref={videoRef} muted playsInline className="camera-video" />
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
          <b>推論FPS</b>
          <span>{fps || "—"}</span>
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
