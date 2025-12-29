'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const PRICE_UAH = Number(process.env.NEXT_PUBLIC_PRICE_UAH || 49);

export default function PayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(null); // { data, signature, order_id, amount }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr('');

        const res = await fetch('/api/liqpay/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ amount: PRICE_UAH }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok || !json?.data || !json?.signature) {
          throw new Error(json?.error || 'Не вдалося створити платіж (checkout)');
        }

        if (!cancelled) {
          setForm({
            data: json.data,
            signature: json.signature,
            order_id: json.order_id,
            amount: json.amount,
          });
        }
      } catch (e) {
        if (!cancelled) setErr(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const goBack = () => router.push('/test');

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-8">
        <div className="text-center">
          <p className="text-xl">Готуємо оплату…</p>
          <p className="text-sm text-gray-400 mt-2">Зараз відкриється LiqPay</p>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-8">
        <div className="w-full max-w-md bg-gray-800 rounded-xl p-6">
          <h1 className="text-2xl font-serif mb-3">Помилка оплати</h1>
          <p className="text-gray-300 text-sm break-words">{err}</p>

          <button
            onClick={goBack}
            className="mt-6 w-full px-6 py-3 bg-red-800 hover:bg-red-700 rounded-lg font-bold"
          >
            Повернутись
          </button>
        </div>
      </main>
    );
  }

  // Рендеримо форму на LiqPay і даємо кнопку "Перейти до оплати"
  // (автосабміт теж можна, але краще з кнопкою — менше блокувань браузером)
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-8">
      <div className="w-full max-w-md bg-gray-800 rounded-xl p-6 text-center">
        <h1 className="text-3xl font-serif mb-2">Оплата</h1>
        <p className="text-gray-300 mb-6">
          Сума: <b>{form?.amount ?? PRICE_UAH} грн</b>
        </p>

        <form method="POST" action="https://www.liqpay.ua/api/3/checkout">
          <input type="hidden" name="data" value={form.data} />
          <input type="hidden" name="signature" value={form.signature} />

          <button
            type="submit"
            className="w-full px-6 py-3 bg-red-800 hover:bg-red-700 rounded-lg font-bold text-lg"
          >
            Перейти до оплати LiqPay
          </button>
        </form>

        <button
          onClick={goBack}
          className="mt-4 w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
        >
          Назад
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Order: {form?.order_id}
        </p>
      </div>
    </main>
  );
}
