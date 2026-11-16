import type { Metadata } from "next";
import { Cormorant, Jost } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const display = Cormorant({
  variable: "--font-display",
  subsets: ["latin"],
});

const text = Jost({
  variable: "--font-text",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.name,
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
