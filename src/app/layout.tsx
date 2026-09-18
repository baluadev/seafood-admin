import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin", "vietnamese"], display: "swap" });

export const metadata: Metadata = {
  title: "SeaShop Admin",
  description: "Quản trị hệ thống SeaShop",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={publicSans.variable}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
