import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const head = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-head",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Carnet d'entraînement",
  description: "Suivi de séances — Push / Pull / Legs",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15171a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${head.variable} ${body.variable}`}>
      <body className="font-body min-h-screen">
        <main className="max-w-md mx-auto px-4 pt-6 safe-bottom">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
