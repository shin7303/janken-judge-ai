"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  LiveCamera,
  type LiveCameraDiagnostics,
} from "@/components/camera/live-camera";
import { evaluateSetupReadiness } from "@/features/setup/evaluate-readiness";

const initialDiagnostics: LiveCameraDiagnostics = {
  running: false,
  fps: 0,
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

  return (
    <>
      <LiveCamera onDiagnostics={onDiagnostics} />
      <section className="setup-diagnostics" aria-labelledby="readiness-title">
        <div>
          <p className="eyebrow">READINESS CHECK</p>
          <h2 id="readiness-title">
            {readiness.ready ? "準備OK" : "準備を確認中"}
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
        {readiness.ready ? (
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
