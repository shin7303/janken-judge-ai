"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { LiveCamera, type LiveHand } from "@/components/camera/live-camera";
import { analyzeRound } from "@/features/round/analyze-round";
import type { FrameObservation } from "@/domain/types";

export default function PlayPage() {
  const observations = useRef<FrameObservation[]>([]);
  const [hands, setHands] = useState<LiveHand[]>([]);
  const [phase, setPhase] = useState("手を枠に入れてください");
  const [count, setCount] = useState<number | null>(null);
  const onFrame = (next: LiveHand[]) => {
    setHands(next);
    observations.current.push(
      ...next.map((hand) => ({
        timestampMs: hand.timestampMs,
        playerId: hand.player,
        gesture: hand.gesture,
        gestureScore: hand.score,
        handVisible: true,
        assignmentConfidence: 1,
      })),
    );
    observations.current = observations.current.slice(-120);
  };
  const startRound = () => {
    if (hands.length !== 2 || hands[0].player === hands[1].player) {
      setPhase("左右に一つずつ手を入れてください");
      return;
    }
    observations.current = [];
    let value = 3;
    setCount(value);
    setPhase("カウントダウン");
    const timer = window.setInterval(() => {
      value -= 1;
      if (value > 0) setCount(value);
      else if (value === 0) {
        setCount(null);
        setPhase("PON!");
        const pon = performance.now();
        window.setTimeout(() => {
          const result = analyzeRound(observations.current, pon);
          sessionStorage.setItem("janken-last-result", JSON.stringify(result));
          location.assign("/play/result");
        }, 1200);
        window.clearInterval(timer);
      }
    }, 1000);
  };
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
        <h1>{count ? `${count}` : phase}</h1>
        <p>
          二人の手が検出されたら開始できます。PON後は自動で時系列解析します。
        </p>
        <button className="button button-primary" onClick={startRound}>
          ラウンドを開始 →
        </button>
      </section>
      <LiveCamera onFrame={onFrame} />
    </main>
  );
}
