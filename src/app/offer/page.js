// src/app/offer/page.js
export const metadata = {
    title: "Публічна оферта | Dark Finder",
    description: "Публічний договір (оферта) сервісу Dark Finder",
  };
  
  export default function OfferPage() {
    return (
      <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-4xl font-serif font-bold mb-3">Публічна оферта</h1>
          <p className="text-gray-300 mb-8">
            Оферта доступна у форматі PDF за посиланням нижче.
          </p>
  
          <a
            href="/docs/offer.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold underline-offset-4"
          >
            Відкрити / завантажити оферту (PDF)
          </a>
  
          <p className="text-gray-400 text-sm mt-6">
            Якщо PDF не відкривається у браузері — натисніть правою кнопкою і оберіть «Зберегти як…».
          </p>
        </div>
      </main>
    );
  }
  