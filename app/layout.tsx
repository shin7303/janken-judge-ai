import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://janken-judge-ai.vercel.app"),
  title: {
    default: "Janken Judge AI | 時間で確かめる、じゃんけんAI審判",
    template: "%s | Janken Judge AI",
  },
  description:
    "二人の手の動きを時間軸で解析し、後出しの可能性を可視化するブラウザAI審判。映像は端末内だけで処理します。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    title: "Janken Judge AI | 時間で確かめる、じゃんけんAI審判",
    description:
      "二人の手の確定時刻と変化を端末内で解析し、判定根拠を可視化します。",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffaf0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
