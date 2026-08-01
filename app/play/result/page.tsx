"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { ReplayPlayer } from "@/components/replay/replay-player";
import type { RoundResult } from "@/domain/types";
import { saveResult } from "@/features/history/store";
import {
  readReplayMetadata,
  REPLAY_METADATA_KEY,
  REPLAY_UNAVAILABLE_KEY,
  REPLAY_URL_KEY,
  revokeStoredReplay,
} from "@/features/replay/storage";
import {
  readStorageItem,
  removeStorageItem,
} from "@/features/storage/safe-storage";

const names = {
  ROCK: "グー",
  PAPER: "パー",
  SCISSORS: "チョキ",
  UNKNOWN: "不明",
} as const;
const verdicts = {
  CLEAR: "問題なし",
  DELAYED: "遅延あり",
  REVIEW: "要確認",
  LIKELY_LATE: "後出しの可能性あり",
  SWITCH_DETECTED: "確定後の手変更を検出",
  INSUFFICIENT_DATA: "判定不能",
  INVALID_ROUND: "無効ラウンド",
} as const;

const noSessionSubscription = () => () => {};
const emptySessionSnapshot = () => "";
function useSessionValue(key: string) {
  return useSyncExternalStore(
    noSessionSubscription,
    () => {
      try {
        return readStorageItem(sessionStorage, key) ?? "";
      } catch {
        return "";
      }
    },
    emptySessionSnapshot,
  );
}

export default function ResultPage() {
  const serializedResult = useSessionValue("janken-last-result");
  const result = useMemo<RoundResult | null>(() => {
    try {
      return serializedResult
        ? (JSON.parse(serializedResult) as RoundResult)
        : null;
    } catch {
      return null;
    }
  }, [serializedResult]);
  const stored = useRef(false);
  const replay = useSessionValue(REPLAY_URL_KEY) || null;
  const serializedMetadata = useSessionValue(REPLAY_METADATA_KEY);
  const replayMetadata = useMemo(
    () => (serializedMetadata ? readReplayMetadata(sessionStorage) : null),
    [serializedMetadata],
  );
  const replayUnavailable = useSessionValue(REPLAY_UNAVAILABLE_KEY) || null;
  const cleanupReplay = useCallback(() => {
    revokeStoredReplay(sessionStorage);
    removeStorageItem(sessionStorage, REPLAY_UNAVAILABLE_KEY);
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", cleanupReplay);
    return () => window.removeEventListener("pagehide", cleanupReplay);
  }, [cleanupReplay]);
  useEffect(() => {
    if (result && !stored.current) {
      saveResult(result);
      stored.current = true;
    }
  }, [result]);
  if (!result)
    return (
      <main className="status-page">
        <div className="status-card">
          <p>結果がありません。</p>
          <Link className="button button-primary" href="/play">
            プレイへ
          </Link>
        </div>
      </main>
    );
  return (
    <main className="status-page">
      <div className="status-card result-card">
        <p className="eyebrow">ROUND RESULT</p>
        <h1>{verdicts[result.fairnessVerdict]}</h1>
        <p>
          Player A: <b>{names[result.playerAFinalGesture]}</b>{" "}
          {result.playerACommit && `+${result.playerACommit.relativeToPonMs}ms`}
          <br />
          Player B: <b>{names[result.playerBFinalGesture]}</b>{" "}
          {result.playerBCommit && `+${result.playerBCommit.relativeToPonMs}ms`}
          <br />
          確定時刻差: <b>{result.delayMs ?? "—"} ms</b>
          <br />
          品質: <b>{result.quality.level}</b>
        </p>
        <div className="hero-actions">
          <Link
            className="button button-primary"
            href="/play"
            onClick={cleanupReplay}
          >
            再戦 →
          </Link>
          <Link
            className="button button-secondary"
            href="/settings"
            onClick={cleanupReplay}
          >
            設定
          </Link>
          <Link
            className="button button-secondary"
            href="/history"
            onClick={cleanupReplay}
          >
            履歴
          </Link>
        </div>
        <ReplayPlayer
          replayUrl={replay}
          metadata={replayMetadata}
          result={result}
          unavailableReason={replayUnavailable}
        />
        <div className="result-reasons">
          <b>判定理由</b>
          <p>
            {result.reasonCodes.length
              ? result.reasonCodes.join(" / ")
              : "両者の手は許容時間内に確定しました。"}
          </p>
        </div>
      </div>
    </main>
  );
}
