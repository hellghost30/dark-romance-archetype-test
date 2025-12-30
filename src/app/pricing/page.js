// src/app/pricing/page.js
export const metadata = {
    title: "Послуги та ціни | Dark Finder",
    description: "Перелік послуг та ціни в гривнях (UAH) для сервісу Dark Finder",
  };
  
  const SERVICES = [
    { name: "Онлайн-тест «Dark Finder»", price: 99 },
    { name: "Повний доступ до результатів тесту", price: 149 },
    { name: "Розширений профіль архетипів", price: 199 },
  ];
  
  export default function PricingPage() {
    return (
      <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-4xl font-serif font-bold mb-3">Послуги та ціни</h1>
          <p className="text-gray-300 mb-8">
            Нижче наведений перелік послуг сервісу <span className="font-semibold">Dark Finder</span> та їхня вартість.
            Усі ціни вказані у гривнях (UAH).
          </p>
  
          <div className="space-y-4">
            {SERVICES.map((s) => (
              <div
                key={s.name}
                className="bg-black/20 rounded-xl p-6 border border-gray-800 flex items-center justify-between gap-4"
              >
                <div className="text-lg font-semibold">{s.name}</div>
                <div className="text-xl font-bold whitespace-nowrap">{s.price} ₴</div>
              </div>
            ))}
          </div>
  
          <div className="mt-10 bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Формат надання послуг</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Послуги надаються онлайн у цифровому вигляді через сайт.</li>
              <li>Доступ/результат надається після підтвердження оплати.</li>
              <li>Оплата здійснюється безготівково через доступні на сайті платіжні сервіси.</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }
  