import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "다다 트립 | 국내 여행 추천 서비스",
  description: "한국관광공사 TourAPI를 활용한 맞춤형 여행 코스 추천 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 dark:bg-zinc-950 flex flex-col justify-start">
        <div className="w-full max-w-[480px] mx-auto min-h-screen bg-white dark:bg-zinc-900 shadow-xl relative flex flex-col pb-16 border-x border-gray-100 dark:border-zinc-800">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
