import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="status-page">
      <div className="status-card">
        <p className="eyebrow">DEMO MODE</p>
        <h1>
          デモモードを
          <br />
          準備しています。
        </h1>
        <p>
          カメラがなくても判定の流れを確認できる固定デモは、
          認識・時系列判定機能とあわせて順次公開します。
        </p>
        <Link className="button button-primary" href="/">
          トップへ戻る <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
