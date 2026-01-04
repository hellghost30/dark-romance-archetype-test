// src/app/result/PaywallClient.js
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LAST_INVOICE_KEY = "lastMonoInvoiceId";

// 60s total, every 3s
const POLL_INTERVAL_MS = 3000;
const POLL_TOTAL_MS = 60000;

export default function PaywallClient({ priceUah }) {
  const router = useRouter();

  const [isPaying, setIsPaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const pollTimerRef = useRef(null);
  const pollStopAtRef = useRef(0);

  const clearPoll = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollStopAtRef.current = 0;
  };

  const startSilentPolling = async () => {
    if (typeof window === "undefined") return;

    const invoiceId = window.localStorage.getItem(LAST_INVOICE_KEY);
    if (!invoiceId) return;

    // already polling
    if (pollTimerRef.current) return;

    setIsSyncing(true);
    pollStopAtRef.current = Date.now() + POLL_TOTAL_MS;

    const attempt = async () => {
      // timeout reached
      if (Date.now() > pollStopAtRef.current) {
        clearPoll();
        setIsSyncing(false);
        return;
      }

      try {
        const res = await fetch("/api/mono/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ invoiceId }),
        });

        const json = await res.json().catch(() => null);

        // If activated -> unlock result
        if (res.ok && json?.activated) {
          window.localStorage.removeItem(LAST_INVOICE_KEY);
          clearPoll();
          setIsSyncing(false);
          router.refresh(); // 🔥 server gate will now show ResultClient
        }
      } catch {
        // silently ignore; next poll will retry
      }
    };

    // first immediate attempt
    await attempt();

    // and then polling
    pollTimerRef.current = setInterval(() => {
      attempt();
    }, POLL_INTERVAL_MS);
  };

  // 1) If returned from payment: start polling and clean paid=1
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const paid = url.searchParams.get("paid");

    if (paid === "1") {
      url.searchParams.delete("paid");
      window.history.replaceState({}, "", url.toString());
      startSilentPolling();
      return;
    }
  }, [router]);

  // 2) Also: if user just refreshes the paywall and invoiceId still exists — continue polling silently
  useEffect(() => {
    if (typeof window === "undefined") return;
    const invoiceId = window.localStorage.getItem(LAST_INVOICE_KEY);
    if (invoiceId) startSilentPolling();

    return () => clearPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden p-6">
      <h1 className="text-3xl font-serif font-bold">Результат доступний після оплати</h1>
      <p className="mt-3 text-gray-300">
        Після оплати результат відкриється автоматично.
      </p>

      {/* Skeleton */}
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
              alert(json?.error || "Не вдалося створити оплату");
              setIsPaying(false);
              return;
            }

            window.localStorage.setItem(LAST_INVOICE_KEY, String(json.invoiceId));
            window.location.href = json.pageUrl;
          } catch {
            alert("Помилка створення оплати");
            setIsPaying(false);
          }
        }}
        disabled={isPaying || isSyncing}
        className="mt-6 w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg disabled:opacity-60"
      >
        {isSyncing ? "Завершуємо оплату..." : isPaying ? "Переадресація..." : `Оплатити — ${priceUah} грн`}
      </button>

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
