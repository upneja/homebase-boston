import type { Metadata } from "next";
import {
  Instrument_Serif,
  DM_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ApartmentScout — Boston 2026",
  description: "AI-powered apartment hunting dashboard for your move to Boston",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg-primary text-text-primary font-body min-h-screen antialiased">
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content — offset by sidebar width on desktop */}
          <main className="flex-1 lg:ml-[260px] pb-20 lg:pb-0 min-w-0">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-7 lg:py-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
