// src/app/legal/page.js
import Link from "next/link";

export const metadata = {
  title: "Legal — Dark Finder",
  description: "Terms, Privacy, Refund Policy",
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-4xl font-serif font-bold mb-2">Legal</h1>
        <p className="text-gray-300 mb-8">
          Нижче — умови користування, політика конфіденційності та політика повернення коштів для сервісу{" "}
          <span className="font-semibold">Dark Finder</span>.
        </p>

        <section className="space-y-8">
          {/* ✅ Додано: реквізити продавця (важливо для LiqPay) */}
          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Реквізити продавця</h2>

            <div className="text-gray-300 space-y-2">
              <div>
                <span className="font-semibold text-white">Продавець:</span> ФОП Тупало Роман Володимирович
              </div>
              <div>
                <span className="font-semibold text-white">ІПН:</span> 3481404610
              </div>
              <div>
                <span className="font-semibold text-white">Юридична адреса:</span>{" "}
                46905, Україна, Дніпропетровська обл., м. Дніпро, вул. Цісик Квітки, буд. 5, кв. 32
              </div>
              <div>
                <span className="font-semibold text-white">Телефон:</span>{" "}
                <a className="underline underline-offset-4 hover:text-white" href="tel:+380956188366">
                  +380956188366
                </a>
              </div>
              <div>
                <span className="font-semibold text-white">Email підтримки:</span>{" "}
                <a className="underline underline-offset-4 hover:text-white" href="mailto:service.on.on@gmail.com">
                  service.on.on@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Terms &amp; Conditions</h2>

            <p className="text-gray-300 mb-4">
              <span className="font-semibold">Назва сервісу:</span> Dark Finder <br />
              <span className="font-semibold">Тип сервісу:</span> цифровий онлайн-сервіс (розважальний тест)
            </p>

            <h3 className="text-lg font-bold mb-2">1. Загальні положення</h3>
            <p className="text-gray-300 mb-3">
              Dark Finder — онлайн-сервіс, який надає доступ до інтерактивного тесту з подальшою генерацією результату
              у вигляді архетипу.
            </p>
            <p className="text-gray-300 mb-3">
              Сервіс має <span className="font-semibold">розважальний характер</span> і не є психологічною, медичною
              або науково-дослідною послугою.
            </p>

            <h3 className="text-lg font-bold mb-2">2. Реєстрація та доступ</h3>
            <p className="text-gray-300 mb-3">
              Для використання сервісу користувач проходить авторизацію через доступні методи входу.
            </p>
            <p className="text-gray-300 mb-3">
              Кожному користувачу може бути надано одну безкоштовну спробу. Подальший доступ до повторних генерацій є
              платним (умови показуються перед оплатою).
            </p>

            <h3 className="text-lg font-bold mb-2">3. Платежі та доступ</h3>
            <p className="text-gray-300 mb-3">
              Оплата надає користувачу доступ до повторних проходжень тесту та/або додаткових функцій сервісу.
            </p>
            <p className="text-gray-300 mb-3">
              Тип доступу (разовий платіж або інший формат), ціна та умови надання доступу вказуються перед здійсненням
              оплати.
            </p>

            <h3 className="text-lg font-bold mb-2">4. Скасування доступу</h3>
            <p className="text-gray-300 mb-3">
              Якщо доступ оформлений як періодичний (підписка), користувач може скасувати її у будь-який момент{" "}
              <span className="font-semibold">через службу підтримки</span>.
            </p>

            <h3 className="text-lg font-bold mb-2">5. Обмеження відповідальності</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Результати тесту не є науково підтвердженими.</li>
              <li>Ми не гарантуємо точність або відповідність результату реальній особистості користувача.</li>
              <li>Результати не слід використовувати для прийняття життєво важливих рішень.</li>
            </ul>
          </div>

          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Disclaimer</h2>
            <p className="text-gray-300 mb-3">
              Усі архетипи, тексти та описи призначені для розваги. Будь-які “пояснення” мають популярний/ігровий
              характер і не є науковим висновком.
            </p>
            <p className="text-gray-300 mb-3">
              Зображення на сторінках можуть бути згенерованими/ілюстративними і{" "}
              <span className="font-semibold">не є реальними фото</span>.
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Refund Policy</h2>
            <p className="text-gray-300 mb-3">
              Оскільки Dark Finder є цифровим сервісом, який надає доступ до контенту онлайн, повернення коштів зазвичай
              не здійснюється.
            </p>
            <p className="text-gray-300 mb-3">Повернення можливе лише у випадках:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-3">
              <li>технічної помилки з боку сервісу;</li>
              <li>неможливості отримати оплачений доступ.</li>
            </ul>
            <p className="text-gray-300">
              Для звернення щодо повернення напишіть у підтримку:{" "}
              <a className="font-semibold underline underline-offset-4 hover:text-white" href="mailto:service.on.on@gmail.com">
                service.on.on@gmail.com
              </a>
              .
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Privacy Policy</h2>
            <p className="text-gray-300 mb-3">Сервіс може збирати мінімальні персональні дані:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-3">
              <li>email (для авторизації та доступу);</li>
              <li>технічну інформацію про сесію (cookies/токени для роботи входу).</li>
            </ul>
            <p className="text-gray-300 mb-3">
              Ці дані використовуються виключно для роботи сервісу та не передаються третім особам, за винятком
              платіжних провайдерів (для обробки платежів) та необхідних технічних сервісів.
            </p>
          </div>

          <div className="text-center">
            <Link href="/" className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold">
              На головну
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
