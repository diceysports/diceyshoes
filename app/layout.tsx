import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DiceyShoes — let the die pick your next pair",
    template: "%s · DiceyShoes",
  },
  description:
    "Six shoes, six faces. Roll the die and the house picks your pair.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen felt-texture">
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
          <footer className="border-t border-white/10">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-bone-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>© {new Date().getFullYear()} DiceyShoes. Odds subject to change.</p>
              <div className="flex gap-4">
                <Link href="/shop" className="transition hover:text-bone">
                  Shop
                </Link>
                <Link href="/cart" className="transition hover:text-bone">
                  Cart
                </Link>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
