import type { Metadata } from "next";
import { Cormorant, Jost } from "next/font/google";
import { site } from "@/config/site";
import { DaylightController } from "@/components/daylight/DaylightController";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
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
      <body>
        <SmoothScroll>
          <Header />
          {children}
          <Footer />
        </SmoothScroll>
        <WhatsAppFab visible />
        <DaylightController />
      </body>
    </html>
  );
}
