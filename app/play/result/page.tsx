"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReplayPlayer } from "@/components/replay/replay-player";
import type { RoundResult } from "@/domain/types";
import { saveResult } from "@/features/history/store";
import {
  readReplayMetadata,
  REPLAY_UNAVAILABLE_KEY,
  REPLAY_URL_KEY,
  revokeStoredReplay,
} from "@/features/replay/storage";

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
export default function ResultPage() {
  const [result] = useState<RoundResult | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem("janken-last-result");
      return saved ? (JSON.parse(saved) as RoundResult) : null;
    } catch {
      return null;
    }
  });
  const stored = useRef(false);
  const [replay] = useState(() =>
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem(REPLAY_URL_KEY),
  );
  const [replayMetadata] = useState(() =>
    typeof window === "undefined" ? null : readReplayMetadata(sessionStorage),
  );
  const [replayUnavailable] = useState(() =>
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem(REPLAY_UNAVAILABLE_KEY),
  );
  const cleanupReplay = useCallback(() => {
    revokeStoredReplay(sessionStorage);
    sessionStorage.removeItem(REPLAY_UNAVAILABLE_KEY);
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
          <Link className="button button-primary" href="/play/setup">
            セットアップへ
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
            href="/play/setup"
            onClick={cleanupReplay}
          >
            セットアップ
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
