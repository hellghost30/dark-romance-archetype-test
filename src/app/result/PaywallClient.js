// src/app/result/PaywallClient.js
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LAST_INVOICE_KEY = "lastMonoInvoiceId";

export default function PaywallClient({ priceUah, neutralInsights }) {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // якщо повернулись з оплати — sync і оновити server-render (щоб показати результат)
  useEffect(() => {
    if (isSyncing) return; // ✅ захист від повторного запуску

    const url = new URL(window.location.href);
    const paid = url.searchParams.get("paid");
    if (paid !== "1") return;

    const invoiceId = window.localStorage.getItem(LAST_INVOICE_KEY);

    // ✅ якщо інвойсу нема — не зависаємо в paid=1
    if (!invoiceId) {
      url.searchParams.delete("paid");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    (async () => {
      try {
        setIsSyncing(true);
        setSyncMessage("");

        const syncRes = await fetch("/api/mono/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ invoiceId }),
        });

        const json = await syncRes.json().catch(() => null);

        // чистимо URL + storage завжди (щоб не зациклитись)
        url.searchParams.delete("paid");
        window.history.replaceState({}, "", url.toString());
        window.localStorage.removeItem(LAST_INVOICE_KEY);

        if (syncRes.ok && json?.activated) {
          // 🔥 оновлюємо серверний гейт — має відкрити результат
          router.refresh();
          return;
        }

        // якщо оплата не success/не активовано — просто пояснимо
        const status = json?.status ? String(json.status) : "unknown";
        setSyncMessage(
          `Оплата ще не підтверджена (status: ${status}). Якщо ти щойно оплатив — спробуй оновити сторінку через 10–20 секунд.`
        );
      } finally {
        setIsSyncing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // залишаємо залежність мінімальною

  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden p-6">
      <h1 className="text-3xl font-serif font-bold">Результат доступний після оплати</h1>
      <p className="mt-3 text-gray-300">
        Активуй підписку на 1 місяць і отримай доступ до результатів (безлімітні проходження).
      </p>

      {syncMessage && (
        <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
          {syncMessage}
        </div>
      )}

      {/* ✅ ТРЮК: TEASER без спойлерів */}
      <div className="mt-4 rounded-xl bg-black/30 border border-white/10 p-4">
        <p className="text-sm text-gray-200 font-semibold">Короткий тізер (без спойлерів):</p>
        <ul className="mt-2 space-y-2 text-gray-300 text-sm list-disc list-inside">
          {(neutralInsights || []).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      {/* ✅ Скелетон-каркас */}
      <div className="mt-4 rounded-xl bg-black/20 border border-white/10 p-4">
        <div className="h-5 w-40 bg-white/10 rounded mb-3" />
        <div className="h-28 bg-white/10 rounded mb-3" />
        <div className="flex gap-2 mb-3">
          <div className="h-8 w-24 bg-white/10 rounded" />
          <div className="h-8 w-28 bg-white/10 rounded" />
          <div className="h-8 w-20 bg-white/10 rounded" />
        </div>
        <div className="h-4 bg-white/10 rounded mb-2" />
        <div className="h-4 bg-white/10 rounded mb-2" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <p className="mt-3 text-xs text-gray-500">
          *Після оплати відкриються назва архетипу, портрет і повний текст сумісності.
        </p>
      </div>

      <button
        onClick={async () => {
          if (isPaying || isSyncing) return;
          setIsPaying(true);

          try {
            const res = await fetch("/api/mono/create-invoice", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ amountUah: priceUah }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.pageUrl || !json?.invoiceId) {
              alert(json?.error || "Не вдалося створити інвойс Monobank");
              setIsPaying(false);
              return;
            }

            window.localStorage.setItem(LAST_INVOICE_KEY, String(json.invoiceId));
            window.location.href = json.pageUrl;
          } catch (e) {
            alert("Не вдалося створити оплату. Перевір /api/mono/create-invoice та env на Render.");
            setIsPaying(false);
          }
        }}
        className="mt-6 w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg disabled:opacity-60"
        disabled={isPaying || isSyncing}
      >
        {isSyncing ? "Перевірка оплати..." : isPaying ? "Переадресація..." : `Підписка на 1 місяць — ${priceUah} грн`}
      </button>

      <p className="mt-3 text-xs text-gray-500">
        Після оплати повернись на сайт — підписка активується автоматично.
      </p>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="flex-1">
          <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold">
            На головну
          </button>
        </Link>
        <Link href="/test" className="flex-1">
          <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
            Пройти ще раз
          </button>
        </Link>
      </div>
    </div>
  );
}
