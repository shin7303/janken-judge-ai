import Link from "next/link";
import { PlaySettingsForm } from "@/components/settings/play-settings-form";

export function SettingsScreen() {
  return (
    <main className="settings-page">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="Janken Judge AI ホーム">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <span>JANKEN JUDGE AI</span>
        </Link>
        <Link className="header-link" href="/play">
          プレイへ
        </Link>
      </header>
      <PlaySettingsForm />
    </main>
  );
}
