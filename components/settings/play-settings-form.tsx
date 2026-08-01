"use client";

import { resetSettings } from "@/features/settings/store";
import { usePlaySettings } from "@/features/settings/use-settings";

export function PlaySettingsForm() {
  const { settings, update } = usePlaySettings();
  return (
    <section className="settings-card" aria-labelledby="settings-title">
      <div className="settings-card-heading">
        <p className="eyebrow">SETTINGS</p>
        <h1 id="settings-title">プレイ設定</h1>
        <p>変更はこの端末にだけ保存されます。</p>
      </div>
      <div className="settings-fields">
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
        <label className="setting-toggle">
          <input
            type="checkbox"
            aria-label="両手を検出したら自動開始"
            checked={settings.autoStartEnabled}
            onChange={(event) =>
              update({ autoStartEnabled: event.target.checked })
            }
          />
          <span>
            <b>両手を検出したら自動開始</b>
            <small>準備状態が安定するとカウントダウンを始めます。</small>
          </span>
        </label>
        <label className="setting-toggle">
          <input
            type="checkbox"
            aria-label="スローリプレイを保存"
            checked={settings.replayEnabled}
            onChange={(event) =>
              update({ replayEnabled: event.target.checked })
            }
          />
          <span>
            <b>スローリプレイを保存</b>
            <small>録画対応ブラウザでは端末内で一時保存します。</small>
          </span>
        </label>
        <label className="setting-toggle">
          <input
            type="checkbox"
            aria-label="プレビューを左右反転"
            checked={settings.mirrored}
            onChange={(event) => update({ mirrored: event.target.checked })}
          />
          <span>
            <b>プレビューを左右反転</b>
            <small>Player A/Bの表示位置も映像に合わせます。</small>
          </span>
        </label>
      </div>
      <button
        className="button button-secondary settings-reset"
        onClick={resetSettings}
      >
        初期値に戻す
      </button>
    </section>
  );
}
