"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  LiveCamera,
  type LiveCameraDiagnostics,
  type LiveHand,
} from "@/components/camera/live-camera";
import { SENSITIVITY_CONFIGS } from "@/domain/round-config";
import type { FrameObservation, PlayerId } from "@/domain/types";
import { analyzeRound } from "@/features/round/analyze-round";
import { createCountdownAudio } from "@/features/round/countdown-audio";
import {
  initialRoundState,
  roundMachine,
} from "@/features/round/round-machine";
import { selectRecorderOptions } from "@/features/replay/media-recorder";
import {
  REPLAY_METADATA_KEY,
  REPLAY_UNAVAILABLE_KEY,
  REPLAY_URL_KEY,
  revokeStoredReplay,
} from "@/features/replay/storage";
import { evaluateSetupReadiness } from "@/features/setup/evaluate-readiness";
import { usePlaySettings } from "@/features/settings/use-settings";
import {
  removeStorageItem,
  writeStorageItem,
} from "@/features/storage/safe-storage";

const players: PlayerId[] = ["PLAYER_A", "PLAYER_B"];

export default function PlayPage() {
  const { settings } = usePlaySettings();
  const config = SENSITIVITY_CONFIGS[settings.sensitivity];
  const observations = useRef<FrameObservation[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const replayChunks = useRef<Blob[]>([]);
  const recordingStartedAt = useRef<number | null>(null);
  const countdownAudio = useRef<ReturnType<typeof createCountdownAudio>>(null);
  const [state, dispatch] = useReducer(roundMachine, initialRoundState);
  const [tabActive, setTabActive] = useState(true);

  const onFrame = useCallback(
    (next: LiveHand[]) => {
      const timestampMs = next[0]?.timestampMs ?? performance.now();
      observations.current.push(
        ...players.map((playerId) => {
          const hand = next.find((item) => item.player === playerId);
          return hand
            ? {
                timestampMs: hand.timestampMs,
                playerId,
                gesture: hand.gesture,
                gestureScore: hand.score,
                handVisible: true,
                centroid: hand.centroid,
                assignmentConfidence: hand.assignmentConfidence,
                crossed: hand.crossed,
              }
            : {
                timestampMs,
                playerId,
                gesture: "UNKNOWN" as const,
                gestureScore: 0,
                handVisible: false,
                centroid: null,
                assignmentConfidence: 0,
              };
        }),
      );
      observations.current = observations.current.slice(
        -config.maxObservationBuffer,
      );
    },
    [config.maxObservationBuffer],
  );

  const onDiagnostics = useCallback(
    (diagnostics: LiveCameraDiagnostics) => {
      const roundInProgress = ["COUNTDOWN", "PON", "OBSERVING"].includes(
        state.phase,
      );
      const readiness = evaluateSetupReadiness(
        {
          cameraAndModelReady: diagnostics.running,
          hands: diagnostics.hands,
          inferenceFps: diagnostics.fps,
          tabActive,
        },
        config,
      );
      dispatch({
        type: "CAMERA_STATUS",
        ready: roundInProgress ? diagnostics.running : readiness.ready,
      });
    },
    [config, state.phase, tabActive],
  );

  useEffect(() => {
    if (!("visibilityState" in document)) return;
    const update = () => {
      const active = document.visibilityState === "visible";
      setTabActive(active);
      if (!active)
        dispatch({
          type: "ABORT",
          reason:
            "タブが非表示になったため、判定を中断しました。再試合してください。",
        });
    };
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const finishRound = useCallback(() => {
    const ponTimestampMs = state.ponTimestampMs;
    if (ponTimestampMs === null) return;
    dispatch({ type: "FINALIZE" });
    const result = analyzeRound(observations.current, ponTimestampMs, config);
    writeStorageItem(
      sessionStorage,
      "janken-last-result",
      JSON.stringify(result),
    );
    const activeRecorder = recorder.current;
    if (activeRecorder?.state === "recording") {
      activeRecorder.onstop = () => {
        if (
          replayChunks.current.length &&
          typeof URL.createObjectURL === "function"
        ) {
          const replayUrl = URL.createObjectURL(
            new Blob(replayChunks.current, {
              type: activeRecorder.mimeType || "video/webm",
            }),
          );
          const storedReplay = writeStorageItem(
            sessionStorage,
            REPLAY_URL_KEY,
            replayUrl,
          );
          if (!storedReplay && typeof URL.revokeObjectURL === "function")
            URL.revokeObjectURL(replayUrl);
          if (recordingStartedAt.current !== null)
            writeStorageItem(
              sessionStorage,
              REPLAY_METADATA_KEY,
              JSON.stringify({
                recordingStartedAtMs: recordingStartedAt.current,
                ponOffsetMs: ponTimestampMs - recordingStartedAt.current,
              }),
            );
        } else {
          writeStorageItem(
            sessionStorage,
            REPLAY_UNAVAILABLE_KEY,
            "録画データを作成できませんでした。判定タイムラインをご確認ください。",
          );
        }
        void countdownAudio.current?.close();
        countdownAudio.current = null;
        dispatch({ type: "COMPLETE" });
        location.assign("/play/result");
      };
      activeRecorder.stop();
    } else {
      void countdownAudio.current?.close();
      countdownAudio.current = null;
      dispatch({ type: "COMPLETE" });
      location.assign("/play/result");
    }
  }, [config, state.ponTimestampMs]);

  useEffect(() => {
    if (state.phase === "COUNTDOWN") countdownAudio.current?.beep();
    if (state.phase === "PON") countdownAudio.current?.beep(true);
  }, [state.countdown, state.phase]);

  useEffect(() => {
    if (state.phase === "COUNTDOWN") {
      const timer = window.setTimeout(
        () =>
          dispatch({
            type: "COUNTDOWN_TICK",
            timestampMs: performance.now(),
          }),
        config.countdownTickMs,
      );
      return () => window.clearTimeout(timer);
    }
    if (state.phase === "PON") {
      const timer = window.setTimeout(
        () => dispatch({ type: "BEGIN_OBSERVING" }),
        config.ponDisplayMs,
      );
      return () => window.clearTimeout(timer);
    }
    if (state.phase === "OBSERVING") {
      const elapsed = performance.now() - (state.ponTimestampMs ?? 0);
      const timer = window.setTimeout(
        finishRound,
        Math.max(0, config.postPonDeadlineMs - elapsed),
      );
      return () => window.clearTimeout(timer);
    }
  }, [
    config.postPonDeadlineMs,
    config.countdownTickMs,
    config.ponDisplayMs,
    finishRound,
    state.countdown,
    state.phase,
    state.ponTimestampMs,
  ]);

  useEffect(() => {
    if (state.phase !== "ABORTED") return;
    const activeRecorder = recorder.current;
    if (activeRecorder?.state === "recording") {
      activeRecorder.onstop = null;
      activeRecorder.stop();
    }
    void countdownAudio.current?.close();
    countdownAudio.current = null;
  }, [state.phase]);

  useEffect(
    () => () => {
      const activeRecorder = recorder.current;
      if (activeRecorder?.state === "recording") {
        activeRecorder.onstop = null;
        activeRecorder.stop();
      }
      void countdownAudio.current?.close();
      countdownAudio.current = null;
    },
    [],
  );

  const startRound = () => {
    if (state.phase !== "CAMERA_READY") return;
    observations.current = [];
    replayChunks.current = [];
    recordingStartedAt.current = null;
    void countdownAudio.current?.close();
    countdownAudio.current = createCountdownAudio(settings.countdownVolume);
    revokeStoredReplay(sessionStorage);
    removeStorageItem(sessionStorage, REPLAY_UNAVAILABLE_KEY);
    if (settings.replayEnabled && stream.current && "MediaRecorder" in window) {
      try {
        recorder.current = new MediaRecorder(
          stream.current,
          selectRecorderOptions(MediaRecorder),
        );
        recorder.current.ondataavailable = (event) => {
          if (event.data.size) replayChunks.current.push(event.data);
        };
        recorder.current.onerror = () =>
          writeStorageItem(
            sessionStorage,
            REPLAY_UNAVAILABLE_KEY,
            "このブラウザではリプレイ録画を継続できませんでした。判定は続行します。",
          );
        recordingStartedAt.current = performance.now();
        recorder.current.start();
      } catch {
        recorder.current = null;
        writeStorageItem(
          sessionStorage,
          REPLAY_UNAVAILABLE_KEY,
          "このブラウザではリプレイ録画を開始できません。判定のみ続行します。",
        );
      }
    } else if (!settings.replayEnabled) {
      writeStorageItem(
        sessionStorage,
        REPLAY_UNAVAILABLE_KEY,
        "設定でスローリプレイが無効です。判定タイムラインは確認できます。",
      );
    } else {
      writeStorageItem(
        sessionStorage,
        REPLAY_UNAVAILABLE_KEY,
        "このブラウザはMediaRecorderに対応していないため、判定のみ行います。",
      );
    }
    dispatch({ type: "START" });
  };

  const phaseLabel =
    state.phase === "COUNTDOWN"
      ? String(state.countdown)
      : state.phase === "PON"
        ? "PON!"
        : state.phase === "OBSERVING" || state.phase === "FINALIZING"
          ? "判定中"
          : state.phase === "CAMERA_READY"
            ? "準備OK"
            : state.phase === "ABORTED"
              ? (state.abortReason ?? "判定を中断しました")
              : "手を枠に入れてください";
  const roundActive = ["COUNTDOWN", "PON", "OBSERVING", "FINALIZING"].includes(
    state.phase,
  );

  return (
    <main className="setup-page">
      <header className="demo-header">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span>JANKEN JUDGE AI
        </Link>
        <Link className="back-link" href="/play/setup">
          ← セットアップ
        </Link>
      </header>
      <section className="setup-intro">
        <p className="eyebrow">LIVE ROUND</p>
        <h1>{phaseLabel}</h1>
        <p>二人の手と推論品質が安定すると開始できます。</p>
        {state.phase === "ABORTED" ? (
          <button
            className="button button-primary"
            onClick={() => dispatch({ type: "RESET", cameraReady: false })}
          >
            再試合の準備 →
          </button>
        ) : (
          <button
            className="button button-primary"
            onClick={startRound}
            disabled={state.phase !== "CAMERA_READY"}
          >
            {roundActive ? "ラウンド進行中" : "ラウンドを開始 →"}
          </button>
        )}
      </section>
      <LiveCamera
        onFrame={onFrame}
        onDiagnostics={onDiagnostics}
        onStream={(next) => {
          stream.current = next;
        }}
        mirrored={settings.mirrored}
      />
    </main>
  );
}
