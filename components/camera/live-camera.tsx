"use client";

import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { blendGesture } from "@/features/gesture/classify-landmarks";

type Hand = { player: "PLAYER_A" | "PLAYER_B"; gesture: string; score: number };
const gestureNames = {
  ROCK: "グー",
  PAPER: "パー",
  SCISSORS: "チョキ",
  UNKNOWN: "認識中",
} as const;
const wasmUrl =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

export function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("カメラを開始してください");
  const [hands, setHands] = useState<Hand[]>([]);
  const [fps, setFps] = useState(0);
  const [active, setActive] = useState(false);
  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    recognizerRef.current?.close();
    recognizerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setHands([]);
    setActive(false);
  }, []);
  useEffect(() => stop, [stop]);
  const start = async () => {
    try {
      setStatus("カメラとモデルを読み込んでいます…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = stream;
      setActive(true);
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const fileset = await FilesetResolver.forVisionTasks(wasmUrl);
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
      recognizerRef.current = recognizer;
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
          const found = result.landmarks
            .map((points, index) => {
              const category = result.gestures[index]?.[0];
              const classification = blendGesture(
                category?.categoryName,
                category?.score ?? 0,
                points,
              );
              const screenX = 1 - (points[0]?.x ?? 0.5);
              const player: Hand["player"] =
                screenX < 0.5 ? "PLAYER_A" : "PLAYER_B";
              return {
                player,
                gesture: gestureNames[classification.gesture],
                score: classification.score,
              };
            })
            .sort((a, b) => a.player.localeCompare(b.player));
          setHands(found);
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
      stop();
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
          <span>{status}</span>
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
              <b>{hand?.gesture ?? "手を検出中"}</b>
              <small>
                {hand ? `信頼度 ${Math.round(hand.score * 100)}%` : "—"}
              </small>
            </div>
          );
        })}
      </div>
      <div className="camera-actions">
        <button className="button button-primary" onClick={start}>
          カメラを開始 →
        </button>
        <button className="button button-secondary" onClick={stop}>
          停止
        </button>
      </div>
      <p className="camera-privacy">
        映像はこの端末内で処理され、サーバーへ送信されません。マイクは使用しません。
      </p>
    </section>
  );
}
