// src/app/contacts/page.js
export const metadata = {
    title: "Контакти | Dark Finder",
    description: "Контактні дані та реквізити продавця сервісу Dark Finder",
  };
  
  export default function ContactsPage() {
    return (
      <main className="min-h-screen bg-gray-900 text-white px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-4xl font-serif font-bold mb-3">Контакти</h1>
          <p className="text-gray-300 mb-8">
            Якщо у вас є питання щодо оплати або доступу до сервісу — звертайтесь у підтримку.
          </p>
  
          <div className="bg-black/20 rounded-xl p-6 border border-gray-800 space-y-3">
            <div className="text-gray-300">
              <span className="font-semibold text-white">Email підтримки:</span>{" "}
              <a className="underline underline-offset-4 hover:text-white" href="mailto:service.on.on@gmail.com">
                service.on.on@gmail.com
              </a>
            </div>
  
            <div className="text-gray-300">
              <span className="font-semibold text-white">Телефон:</span>{" "}
              <a className="underline underline-offset-4 hover:text-white" href="tel:+380956188366">
                +380956188366
              </a>
            </div>
  
            <hr className="border-gray-800 my-4" />
  
            <div className="text-gray-300">
              <div className="font-semibold text-white mb-2">Реквізити продавця</div>
  
              <div><span className="font-semibold text-white">ФОП:</span> Тупало Роман Володимирович</div>
              <div><span className="font-semibold text-white">ІПН:</span> 3481404610</div>
              <div>
                <span className="font-semibold text-white">Юридична адреса:</span>{" "}
                46905, Україна, Дніпропетровська обл., м. Дніпро, вул. Цісик Квітки, буд. 5, кв. 32
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  