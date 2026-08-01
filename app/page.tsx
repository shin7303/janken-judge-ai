import Link from "next/link";

const features = [
  [
    "⏱",
    "時系列で判定",
    "PONから両者の手が確定するまでをミリ秒単位で追います。",
  ],
  [
    "◌",
    "根拠まで見える",
    "スローリプレイとタイムラインで、判定の理由を確かめられます。",
  ],
  [
    "⌂",
    "映像は端末内だけ",
    "カメラ映像をサーバーへ送らない、プライバシー重視の設計です。",
  ],
] as const;

const stack = [
  "Next.js",
  "TypeScript",
  "MediaPipe",
  "Web Worker",
  "Vitest",
  "Playwright",
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="メインナビゲーション">
          <Link className="brand" href="/" aria-label="Janken Judge AI ホーム">
            <span className="brand-mark" aria-hidden="true">
              ✦
            </span>
            <span>JANKEN JUDGE AI</span>
          </Link>
          <a
            className="repository-link"
            href="https://github.com/shin7303/janken-judge-ai"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">BROWSER AI REFEREE</p>
            <h1>
              その一手、
              <br />
              <em>時間で</em>確かめよう。
            </h1>
            <p className="hero-description">
              二人のじゃんけんをカメラで解析。勝敗だけでなく、手が確定した時刻と変化を可視化する、娯楽向けAI審判です。
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/play/setup">
                二人でプレイ <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary" href="/demo">
                デモを見る <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className="privacy-note">
              <span aria-hidden="true">●</span>{" "}
              映像は端末内で処理。アップロードしません。
            </p>
          </div>

          <div className="judge-card" aria-label="判定結果のイメージ">
            <div className="card-topline">
              <span>ROUND ANALYSIS</span>
              <span className="live-dot">● LIVE</span>
            </div>
            <div className="players">
              <div>
                <span className="player-label">PLAYER A</span>
                <strong>✌</strong>
                <span className="gesture">チョキ</span>
                <span className="time">+142 ms</span>
              </div>
              <span className="versus">VS</span>
              <div>
                <span className="player-label">PLAYER B</span>
                <strong>✋</strong>
                <span className="gesture">パー</span>
                <span className="time late">+524 ms</span>
              </div>
            </div>
            <div className="timeline" aria-hidden="true">
              <span className="timeline-start">−800</span>
              <i />
              <b />
              <i />
              <span className="timeline-end">+1200</span>
              <small>PON</small>
            </div>
            <div className="verdict">
              <span className="verdict-icon" aria-hidden="true">
                !
              </span>
              <div>
                <b>後出しの可能性あり</b>
                <p>382ms遅れて有利な手が確定しました</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-section" aria-labelledby="features-title">
        <p className="eyebrow">WHAT IT JUDGES</p>
        <h2 id="features-title">勝敗だけでは、終わらない。</h2>
        <div className="feature-grid">
          {features.map(([icon, title, description]) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon" aria-hidden="true">
                {icon}
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="how-section"
        id="how-to-play"
        aria-labelledby="how-title"
      >
        <div>
          <p className="eyebrow">HOW IT WORKS</p>
          <h2 id="how-title">
            カメラ一台、
            <br />
            二人だけ。
          </h2>
        </div>
        <ol className="steps">
          <li>
            <span>01</span>
            <div>
              <h3>手を枠に入れる</h3>
              <p>左右のプレイヤー領域に、それぞれ一つの手を映します。</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>「ポン！」で勝負</h3>
              <p>カウントダウン後、AIが連続する映像を解析します。</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>根拠を確認する</h3>
              <p>確定時刻、リプレイ、タイムラインを結果として表示します。</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="stack-section" aria-label="技術スタック">
        <p>CLIENT-SIDE ONLY</p>
        <div>
          {stack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="notice" aria-label="利用上の注意">
        <span aria-hidden="true">※</span>
        <p>
          本アプリの後出し判定は映像上の時刻差を用いた娯楽向け推定です。不正の意図や事実を断定するものではありません。
        </p>
      </section>
    </main>
  );
}
