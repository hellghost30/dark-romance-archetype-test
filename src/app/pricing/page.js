// src/app/pricing/page.js
export const metadata = {
    title: "Послуги та ціни | Dark Finder",
    description: "Перелік послуг та ціни в гривнях (UAH) для сервісу Dark Finder",
  };
  
  export default function PricingPage() {
    return (
      <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-4xl font-serif font-bold mb-3">Послуги та ціни</h1>
  
          <p className="text-gray-300 mb-8">
            Нижче наведена інформація про платну послугу сервісу{" "}
            <span className="font-semibold">Dark Finder</span>. Усі ціни вказані у гривнях (UAH).
          </p>
  
          {/* ЄДИНА ПОСЛУГА */}
          <div className="bg-black/20 rounded-xl p-6 border border-gray-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold mb-1">Доступ до повного результату</div>
              <div className="text-gray-300 text-sm">
                Одноразова оплата відкриває доступ до результату тесту.
              </div>
            </div>
  
            <div className="text-2xl font-bold whitespace-nowrap">49 ₴</div>
          </div>
  
          {/* ФОРМАТ НАДАННЯ ПОСЛУГ */}
          <div className="mt-10 bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Формат надання послуг</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Послуга надається онлайн у цифровому вигляді через сайт.</li>
              <li>Доступ активується автоматично після підтвердження оплати.</li>
              <li>Оплата здійснюється безготівково через платіжні сервіси, доступні на сайті.</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }
  