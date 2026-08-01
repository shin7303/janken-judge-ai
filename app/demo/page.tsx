"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { analyzeRound } from "@/features/round/analyze-round";
import { demoScenarios } from "@/features/demo/scenarios";

const labels = {
  ROCK: "グー",
  PAPER: "パー",
  SCISSORS: "チョキ",
  UNKNOWN: "不明",
  PLAYER_A: "Player A",
  PLAYER_B: "Player B",
  DRAW: "あいこ",
  UNDECIDED: "判定保留",
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

export default function DemoPage() {
  const [scenarioId, setScenarioId] = useState(demoScenarios[0].id);
  const scenario =
    demoScenarios.find((item) => item.id === scenarioId) ?? demoScenarios[0];
  const result = useMemo(
    () => analyzeRound(scenario.observations, scenario.ponTimestampMs),
    [scenario],
  );
  return (
    <main className="demo-page">
      <header className="demo-header">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span>JANKEN JUDGE AI
        </Link>
        <Link className="back-link" href="/">
          ← トップへ
        </Link>
      </header>
      <section className="demo-intro">
        <p className="eyebrow">INTERACTIVE DEMO</p>
        <h1>
          判定の根拠を、<em>触って確かめる。</em>
        </h1>
        <p>カメラなしで、時系列判定がどのように結論へ至るかを確認できます。</p>
      </section>
      <section className="demo-layout">
        <aside className="scenario-list" aria-label="デモシナリオ">
          {demoScenarios.map((item) => (
            <button
              className={
                item.id === scenario.id ? "scenario selected" : "scenario"
              }
              key={item.id}
              onClick={() => setScenarioId(item.id)}
            >
              <b>{item.title}</b>
              <span>{item.description}</span>
            </button>
          ))}
        </aside>
        <article className="result-panel">
          <div className="result-heading">
            <span>ROUND RESULT</span>
            <strong
              className={`verdict ${result.fairnessVerdict.toLowerCase()}`}
            >
              {verdicts[result.fairnessVerdict]}
            </strong>
          </div>
          <div className="result-hands">
            <div>
              <span>PLAYER A</span>
              <b>{labels[result.playerAFinalGesture]}</b>
              <small>
                {result.playerACommit
                  ? `+${result.playerACommit.relativeToPonMs}ms`
                  : "未確定"}
              </small>
            </div>
            <i>VS</i>
            <div>
              <span>PLAYER B</span>
              <b>{labels[result.playerBFinalGesture]}</b>
              <small>
                {result.playerBCommit
                  ? `+${result.playerBCommit.relativeToPonMs}ms`
                  : "未確定"}
              </small>
            </div>
          </div>
          <div className="winner-line">
            勝者: <strong>{labels[result.winner]}</strong>
          </div>
          <div className="demo-timeline">
            <span>−800ms</span>
            <div>
              <i />
              <b style={{ left: "40%" }}>PON</b>
              {result.playerACommit && (
                <b
                  style={{
                    left: `${40 + Math.min(result.playerACommit.relativeToPonMs / 12, 48)}%`,
                  }}
                >
                  A確定
                </b>
              )}
              {result.playerBCommit && (
                <b
                  style={{
                    left: `${40 + Math.min(result.playerBCommit.relativeToPonMs / 12, 48)}%`,
                  }}
                >
                  B確定
                </b>
              )}
            </div>
            <span>+1200ms</span>
          </div>
          <dl className="metrics">
            <div>
              <dt>確定時刻差</dt>
              <dd>{result.delayMs === null ? "—" : `${result.delayMs} ms`}</dd>
            </div>
            <div>
              <dt>データ品質</dt>
              <dd>{result.quality.level}</dd>
            </div>
            <div>
              <dt>理由コード</dt>
              <dd>
                {result.reasonCodes.length
                  ? result.reasonCodes.join(", ")
                  : "CLEAR"}
              </dd>
            </div>
          </dl>
          <p className="demo-disclaimer">
            この結果は固定データを使った娯楽向けのデモです。不正や意図を断定しません。
          </p>
        </article>
      </section>
    </main>
  );
}
