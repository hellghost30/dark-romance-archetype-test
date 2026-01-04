// src/app/layout.js
import "./globals.css";
import Providers from "./Providers";
import Link from "next/link";
import TopBar from "./components/TopBar";

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
            {/* ✅ TopBar на всіх сторінках */}
            <TopBar />

            <div className="flex-1">{children}</div>

            <footer className="border-t border-gray-800 bg-black/20">
              <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-gray-400 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-between">
                <span>© {new Date().getFullYear()} Dark Romance Archetype Test</span>

                <div className="flex flex-wrap gap-3 items-center">
                  <Link href="/pricing" className="hover:text-white underline underline-offset-4">
                    Послуги та ціни
                  </Link>

                  <Link href="/contacts" className="hover:text-white underline underline-offset-4">
                    Контакти
                  </Link>

                  <Link href="/offer" className="hover:text-white underline underline-offset-4">
                    Публічна оферта
                  </Link>

                  <a
                    href="/docs/offer.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white underline underline-offset-4"
                  >
                    Оферта (PDF)
                  </a>

                  <Link href="/legal" className="hover:text-white underline underline-offset-4">
                    Terms • Privacy • Refund
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
