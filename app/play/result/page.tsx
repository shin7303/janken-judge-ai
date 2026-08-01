"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RoundResult } from "@/domain/types";
import { saveResult } from "@/features/history/store";

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
    const saved = sessionStorage.getItem("janken-last-result");
    return saved ? (JSON.parse(saved) as RoundResult) : null;
  });
  const stored = useRef(false);
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
      <div className="status-card">
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
          <Link className="button button-primary" href="/play">
            再戦 →
          </Link>
          <Link className="button button-secondary" href="/play/setup">
            セットアップ
          </Link>
          <Link className="button button-secondary" href="/history">
            履歴
          </Link>
        </div>
      </div>
    </main>
  );
}
