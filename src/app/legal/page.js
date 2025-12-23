// src/app/legal/page.js
import Link from "next/link";

export const metadata = {
  title: "Legal — Dark Romance Archetype Test",
  description: "Terms, Privacy, Refund Policy",
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-4xl font-serif font-bold mb-2">Legal</h1>
        <p className="text-gray-300 mb-8">
          Нижче — умови користування, політика конфіденційності та політика повернення коштів для сервісу{" "}
          <span className="font-semibold">Dark Romance Archetype Test</span>.
        </p>

        <section className="space-y-8">
          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Terms &amp; Conditions</h2>

            <p className="text-gray-300 mb-4">
              <span className="font-semibold">Назва сервісу:</span> Dark Romance Archetype Test <br />
              <span className="font-semibold">Тип сервісу:</span> цифровий онлайн-сервіс (розважальний тест)
            </p>

            <h3 className="text-lg font-bold mb-2">1. Загальні положення</h3>
            <p className="text-gray-300 mb-3">
              Dark Romance Archetype Test — онлайн-сервіс, який надає доступ до інтерактивного тесту з подальшою
              генерацією результату у вигляді архетипу персонажа.
            </p>
            <p className="text-gray-300 mb-3">
              Сервіс має <span className="font-semibold">розважальний характер</span> і не є психологічною,
              медичною або науково-дослідною послугою.
            </p>

            <h3 className="text-lg font-bold mb-2">2. Реєстрація та доступ</h3>
            <p className="text-gray-300 mb-3">
              Для використання сервісу користувач проходить авторизацію через доступні методи входу.
            </p>
            <p className="text-gray-300 mb-3">
              Кожному користувачу може бути надано одну безкоштовну спробу. Подальший доступ до повторних генерацій
              є платним (умови показуються перед оплатою).
            </p>

            <h3 className="text-lg font-bold mb-2">3. Платежі та підписка</h3>
            <p className="text-gray-300 mb-3">
              Оплата надає користувачу доступ до повторних проходжень тесту та/або додаткових функцій сервісу.
            </p>
            <p className="text-gray-300 mb-3">
              Тип доступу (разовий платіж або підписка), ціна та періодичність (якщо це підписка) чітко
              вказуються перед здійсненням оплати.
            </p>

            <h3 className="text-lg font-bold mb-2">4. Відміна підписки</h3>
            <p className="text-gray-300 mb-3">
              Користувач може скасувати підписку у будь-який момент{" "}
              <span className="font-semibold">лише через службу підтримки</span>.
            </p>
            <p className="text-gray-300 mb-3">
              Після скасування підписки доступ залишається активним до кінця оплаченого періоду (якщо інше не
              передбачено умовами конкретного платіжного провайдера).
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
              <span className="font-semibold">не є реальними фото</span>. Вони можуть не співпадати з вашим
              уявленням про персонажів або образи “на 100%”.
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Refund Policy</h2>
            <p className="text-gray-300 mb-3">
              Оскільки Dark Romance Archetype Test є цифровим сервісом, який надає миттєвий доступ до контенту,
              повернення коштів зазвичай не здійснюється.
            </p>
            <p className="text-gray-300 mb-3">
              Повернення можливе лише у випадках:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-3">
              <li>технічної помилки з боку сервісу;</li>
              <li>неможливості отримати оплачений доступ.</li>
            </ul>
            <p className="text-gray-300">
              Для звернення щодо повернення напишіть у підтримку:{" "}
              <span className="font-semibold">support@dark-romance-test.com</span> (замінити на твій реальний email).
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-6 border border-gray-800">
            <h2 className="text-2xl font-serif mb-3">Privacy Policy</h2>
            <p className="text-gray-300 mb-3">
              Сервіс може збирати мінімальні персональні дані:
            </p>
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
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold"
            >
              На головну
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
