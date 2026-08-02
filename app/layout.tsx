import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ahmet Tepe | Kariyer Komuta Merkezi",
  description: "İş başvuruları, günlük görevler ve vatandaşlık hedefi için kişisel takip sistemi.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
