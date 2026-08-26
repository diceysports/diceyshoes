import type { Metadata } from "next";
import { Big_Shoulders_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";

const display = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://diceyshoes.example.com"),
  title: {
    default: "Dicey Shoes — Premium Sneakers & Luxury Footwear",
    template: "%s — Dicey Shoes",
  },
  description:
    "Discover the latest sneakers, luxury footwear and defining releases from Nike, Jordan, Adidas, Yeezy, Balenciaga, Gucci and more.",
  robots: { index: false, follow: false }, // POC — flip to index:true at launch
  openGraph: {
    title: "Dicey Shoes",
    description: "Premium footwear discovery — sport culture and luxury fashion, in one catalog.",
    siteName: "Dicey Shoes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body antialiased">
        <Providers>
          <div className="border-b border-chrome-line bg-chrome py-1.5 text-center text-[11px] uppercase tracking-[0.14em] text-chrome-fog">
            New Releases &bull; Restocks &bull; Latest Drops
          </div>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
