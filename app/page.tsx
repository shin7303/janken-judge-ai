import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="Janken Judge AI ホーム">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <span>JANKEN JUDGE AI</span>
        </Link>
        <Link className="header-link" href="/settings">
          設定
        </Link>
      </header>
      <section className="landing-main">
        <p className="play-mode">BROWSER AI REFEREE</p>
        <h1>
          手を入れるだけ。
          <br />
          <em>あとは、AI審判。</em>
        </h1>
        <p>
          カメラを有効にしたら、二人の手を左右の枠に入れるだけで自動開始します。映像は端末内だけで処理します。
        </p>
        <Link className="button button-primary landing-cta" href="/play">
          カメラを始める
          <span aria-hidden="true">→</span>
        </Link>
      </section>
      <section className="landing-steps" aria-label="使い方">
        <div>
          <b>01</b>
          <span>カメラを有効にする</span>
        </div>
        <div>
          <b>02</b>
          <span>左右に一人ずつ手を入れる</span>
        </div>
        <div>
          <b>03</b>
          <span>自動でじゃんけん開始</span>
        </div>
      </section>
      <p className="landing-note">
        時刻差は娯楽向けの推定です。不正や意図を断定しません。
      </p>
    </main>
  );
}
