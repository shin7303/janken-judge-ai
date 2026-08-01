"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  LiveCamera,
  type LiveCameraDiagnostics,
} from "@/components/camera/live-camera";
import { evaluateSetupReadiness } from "@/features/setup/evaluate-readiness";
import { SENSITIVITY_CONFIGS } from "@/domain/round-config";
import { resetSettings } from "@/features/settings/store";
import { usePlaySettings } from "@/features/settings/use-settings";

const initialDiagnostics: LiveCameraDiagnostics = {
  running: false,
  fps: 0,
  inferenceMs: 0,
  executionMode: null,
  qualityProfile: "standard",
  brightness: null,
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
  const { settings, update } = usePlaySettings();
  const config = SENSITIVITY_CONFIGS[settings.sensitivity];
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
  const readiness = evaluateSetupReadiness(
    {
      cameraAndModelReady: diagnostics.running,
      hands: diagnostics.hands,
      inferenceFps: diagnostics.fps,
      tabActive,
    },
    config,
  );
  useEffect(() => {
    if (!readiness.ready) {
      const resetTimer = window.setTimeout(() => setStableReady(false), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const timer = window.setTimeout(
      () => setStableReady(true),
      config.readyStableMs,
    );
    return () => window.clearTimeout(timer);
  }, [config.readyStableMs, readiness.ready]);
  const setupReady = readiness.ready && stableReady;

  return (
    <>
      <LiveCamera onDiagnostics={onDiagnostics} mirrored={settings.mirrored} />
      <section className="settings-panel" aria-labelledby="settings-title">
        <div>
          <p className="eyebrow">PLAY SETTINGS</p>
          <h2 id="settings-title">判定設定</h2>
        </div>
        <label>
          判定感度
          <select
            value={settings.sensitivity}
            onChange={(event) =>
              update({
                sensitivity: event.target.value as typeof settings.sensitivity,
              })
            }
          >
            <option value="strict">厳しめ</option>
            <option value="standard">標準</option>
            <option value="lenient">ゆるめ</option>
          </select>
        </label>
        <label>
          カウントダウン音量
          <select
            value={settings.countdownVolume}
            onChange={(event) =>
              update({ countdownVolume: Number(event.target.value) })
            }
          >
            <option value="0">ミュート</option>
            <option value="0.25">小</option>
            <option value="0.5">標準</option>
            <option value="1">大</option>
          </select>
        </label>
        <label className="settings-check">
          <input
            type="checkbox"
            checked={settings.replayEnabled}
            onChange={(event) =>
              update({ replayEnabled: event.target.checked })
            }
          />
          スローリプレイを保存
        </label>
        <label className="settings-check">
          <input
            type="checkbox"
            checked={settings.mirrored}
            onChange={(event) => update({ mirrored: event.target.checked })}
          />
          プレビューを左右反転
        </label>
        <button className="button button-secondary" onClick={resetSettings}>
          設定を初期値に戻す
        </button>
      </section>
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
