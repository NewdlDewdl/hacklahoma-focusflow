import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "FocusFlow — AI Focus Coach",
  description: "Real-time AI-powered focus coaching with webcam tracking, voice nudges, and multiplayer accountability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.js" defer></script>
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
