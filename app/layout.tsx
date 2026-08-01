import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Janken Judge AI | 時間で確かめる、じゃんけんAI審判",
  description:
    "二人の手の動きを時間軸で解析し、後出しの可能性を可視化するブラウザAI審判。映像は端末内だけで処理します。",
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
