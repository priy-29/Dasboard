import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dasboard — Penjualan",
  description: "Dashboard penjualan dan sistem pemesanan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
