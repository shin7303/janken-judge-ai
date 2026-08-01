import Link from "next/link";
import { SetupCamera } from "@/components/setup/setup-camera";

export default function SetupPage() {
  return (
    <main className="setup-page">
      <header className="demo-header">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span>JANKEN JUDGE AI
        </Link>
        <Link className="back-link" href="/">
          ← トップへ
        </Link>
      </header>
      <section className="setup-intro">
        <p className="eyebrow">CAMERA SETUP</p>
        <h1>
          二人の手を、<em>AIが見守る。</em>
        </h1>
        <p>
          左右それぞれの枠に、手首から指先までを入れてください。開始ボタンを押すまでカメラは起動しません。
        </p>
      </section>
      <SetupCamera />
    </main>
  );
}
