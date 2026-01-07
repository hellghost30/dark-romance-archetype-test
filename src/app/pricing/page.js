// src/app/pricing/page.js
import PaywallClient from "./PaywallClient";

export const metadata = {
  title: "Відкрити результат | Dark Finder",
  description: "Оплата доступу до повного результату тесту Dark Finder",
};

const PRICE_UAH = 49;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Результат готовий</h1>
          <p className="text-gray-300">
            Оплати один раз — і результат відкриється автоматично.
          </p>
        </div>

        {/* PAYWALL */}
        <PaywallClient priceUah={PRICE_UAH} />

        {/* TRUST + LINKS */}
        <div className="mt-8 text-sm text-gray-400 space-y-2">
          <p>
            Натискаючи кнопку оплати, ти погоджуєшся з{" "}
            <a className="underline" href="/offer" target="_blank" rel="noopener noreferrer">
              публічною офертою
            </a>
            .
          </p>
          <p>
            Потрібна допомога?{" "}
            <a className="underline" href="/contacts">
              Контакти
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
