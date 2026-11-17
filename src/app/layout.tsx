import type { Metadata } from "next";
import { Cormorant, Jost } from "next/font/google";
import { site } from "@/config/site";
import { orgJsonLd, jsonLdString } from "@/lib/seo";
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
  title: { default: `${site.name} · Arquitetura e interiores`, template: "%s · Amene" },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: `${site.name} · Arquitetura e interiores`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(orgJsonLd(site)) }}
        />
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
