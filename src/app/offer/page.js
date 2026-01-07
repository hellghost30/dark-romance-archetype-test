export const metadata = {
    title: "Умови доступу | Dark Finder",
    description: "Умови одноразового доступу до результату тесту Dark Finder",
  };
  
  export default function OfferPage() {
    return (
      <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-4xl font-serif font-bold mb-4">
            Умови доступу
          </h1>
  
          <p className="text-gray-300 mb-6 text-lg">
            Купуючи доступ, ти отримуєш <span className="text-white font-semibold">одноразовий повний результат тесту</span> —
            з детальним описом архетипу та поясненням сумісності.
          </p>
  
          <div className="bg-black/30 border border-white/10 rounded-xl p-6 mb-8">
            <ul className="space-y-3 text-gray-300">
              <li>• Повний опис твого архетипу</li>
              <li>• Пояснення, чому саме цей тип тобі підходить</li>
              <li>• Персональний результат на основі відповідей</li>
              <li>• Одноразовий доступ після оплати</li>
            </ul>
          </div>
  
          <p className="text-gray-400 mb-8">
            Оплата надає доступ саме до результату твого проходження тесту.
            Повторне проходження тесту формує новий результат.
          </p>
  
          <div className="border-t border-white/10 pt-6">
            <p className="text-gray-400 mb-3">
              Юридичні умови сервісу:
            </p>
  
            <a
              href="/docs/offer.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold"
            >
              Переглянути публічну оферту (PDF)
            </a>
  
            <p className="text-gray-500 text-sm mt-4">
              PDF містить повний текст публічного договору.
            </p>
          </div>
        </div>
      </main>
    );
  }
  