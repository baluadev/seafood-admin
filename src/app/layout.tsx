import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "Tạp hóa nhà SIN Admin",
  description: "Quản trị hệ thống Tạp hóa nhà SIN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={poppins.variable}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
