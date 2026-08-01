"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  LiveCamera,
  type LiveCameraDiagnostics,
} from "@/components/camera/live-camera";
import { evaluateSetupReadiness } from "@/features/setup/evaluate-readiness";
import { ROUND_CONFIG } from "@/domain/round-config";

const initialDiagnostics: LiveCameraDiagnostics = {
  running: false,
  fps: 0,
  inferenceMs: 0,
  executionMode: null,
  qualityProfile: "standard",
  hands: [],
};

const checkLabels = {
  cameraAndModel: "カメラと認識モデル",
  playerRegions: "左右に一つずつの手",
  gestureConfidence: "ジェスチャー信頼度",
  inferencePerformance: "推論速度",
  activeTab: "アクティブなタブ",
} as const;

export function SetupCamera() {
  const [diagnostics, setDiagnostics] =
    useState<LiveCameraDiagnostics>(initialDiagnostics);
  const [tabActive, setTabActive] = useState(true);
  const [stableReady, setStableReady] = useState(false);

  useEffect(() => {
    if (!("visibilityState" in document)) return;
    const updateVisibility = () =>
      setTabActive(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const onDiagnostics = useCallback((next: LiveCameraDiagnostics) => {
    setDiagnostics(next);
  }, []);
  const readiness = evaluateSetupReadiness({
    cameraAndModelReady: diagnostics.running,
    hands: diagnostics.hands,
    inferenceFps: diagnostics.fps,
    tabActive,
  });
  useEffect(() => {
    if (!readiness.ready) {
      const resetTimer = window.setTimeout(() => setStableReady(false), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const timer = window.setTimeout(
      () => setStableReady(true),
      ROUND_CONFIG.readyStableMs,
    );
    return () => window.clearTimeout(timer);
  }, [readiness.ready]);
  const setupReady = readiness.ready && stableReady;

  return (
    <>
      <LiveCamera onDiagnostics={onDiagnostics} />
      <section className="setup-diagnostics" aria-labelledby="readiness-title">
        <div>
          <p className="eyebrow">READINESS CHECK</p>
          <h2 id="readiness-title">
            {setupReady
              ? "準備OK"
              : readiness.ready
                ? "安定性を確認中"
                : "準備を確認中"}
          </h2>
        </div>
        <ul>
          {Object.entries(readiness.checks).map(([key, passed]) => (
            <li key={key} data-passed={passed}>
              <span aria-hidden="true">{passed ? "✓" : "…"}</span>
              {checkLabels[key as keyof typeof checkLabels]}
            </li>
          ))}
        </ul>
      </section>
      <div className="camera-actions setup-next">
        {setupReady ? (
          <Link className="button button-primary" href="/play">
            ラウンドへ進む →
          </Link>
        ) : (
          <button className="button button-primary" disabled>
            準備完了までお待ちください
          </button>
        )}
      </div>
    </>
  );
}
