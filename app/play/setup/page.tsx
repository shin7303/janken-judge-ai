import Link from "next/link";

export default function SetupPage() {
  return (
    <main className="status-page">
      <div className="status-card">
        <p className="eyebrow">CAMERA SETUP</p>
        <h1>
          カメラ判定を
          <br />
          準備しています。
        </h1>
        <p>
          カメラ権限、MediaPipe による手認識、二人の手の位置判定を
          実装後、この画面から安全にカメラを開始できるようにします。
        </p>
        <Link className="button button-primary" href="/">
          トップへ戻る <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
