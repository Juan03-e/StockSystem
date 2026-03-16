import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "StockSystem", template: "%s | StockSystem" },
  description: "Sistema de gestión de inventario para retail",
  robots: { index: false, follow: false }, // internal tool — no indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${lexend.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
