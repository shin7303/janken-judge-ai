"use client";
import Link from "next/link";
import { useState } from "react";
import {
  clearHistory,
  exportHistory,
  readHistory,
  type HistoryItem,
} from "@/features/history/store";
export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>(() =>
    typeof window === "undefined" ? [] : readHistory(),
  );
  const download = () => {
    const url = URL.createObjectURL(exportHistory());
    const link = document.createElement("a");
    link.href = url;
    link.download = "janken-history.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="status-page">
      <div className="status-card">
        <p className="eyebrow">ROUND HISTORY</p>
        <h1>直近の対戦</h1>
        {items.length ? (
          <>
            <ul className="history-list">
              {items.map((item) => (
                <li key={item.id}>
                  <b>{item.fairnessVerdict}</b>
                  <span>
                    {item.delayMs ?? "—"}ms ·{" "}
                    {new Date(item.playedAt).toLocaleString("ja-JP")}
                  </span>
                </li>
              ))}
            </ul>
            <div className="hero-actions">
              <button className="button button-primary" onClick={download}>
                JSONを書き出す
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  clearHistory();
                  setItems([]);
                }}
              >
                全削除
              </button>
            </div>
          </>
        ) : (
          <p>まだ対戦履歴はありません。</p>
        )}
        <p>
          <Link href="/play">プレイへ戻る →</Link>
        </p>
      </div>
    </main>
  );
}
