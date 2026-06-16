import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sentence.today",
  description: "모든 글은 하나의 문장에서 시작된다",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
