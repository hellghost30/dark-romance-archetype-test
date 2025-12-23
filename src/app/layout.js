// src/app/layout.js
import "./globals.css";
import Providers from "./Providers";
import Link from "next/link";

export const metadata = {
  title: "Dark Romance Partner Finder",
  description: "Find your perfect dark romance archetype",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-gray-900">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">{children}</div>

            <footer className="border-t border-gray-800 bg-black/20">
              <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-gray-400 flex items-center justify-between">
                <span>© {new Date().getFullYear()} Dark Romance Archetype Test</span>
                <Link href="/legal" className="hover:text-white underline underline-offset-4">
                   (Terms • Privacy • Refund)
                </Link>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
