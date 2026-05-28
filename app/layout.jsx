import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata = {
  title: "ひらがな よもう",
  description: "じぶんで かいた ひらがなを、こえで よんでくれる れんしゅうアプリ",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,      // 子どもの誤操作によるピンチズームを防ぐ
  userScalable: false,
  themeColor: "#FFF6E9",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=M+PLUS+Rounded+1c:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-ZR6HMSN154" />
    </html>
  );
}
