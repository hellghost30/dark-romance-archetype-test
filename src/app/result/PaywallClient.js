"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LAST_INVOICE_KEY = "lastMonoInvoiceId";
const LAST_RESULT_QS_KEY = "lastResultQs";

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

  const redirectToLastResult = () => {
    try {
      const qs = window.localStorage.getItem(LAST_RESULT_QS_KEY);
      if (qs && qs.includes("dominance=")) {
        router.replace(`/result?${qs}`);
        return true;
      }
    } catch {}
    return false;
  };

  const startSilentPolling = async () => {
    if (typeof window === "undefined") return;

    const invoiceId = window.localStorage.getItem(LAST_INVOICE_KEY);
    if (!invoiceId) return;
    if (pollTimerRef.current) return;

    setIsSyncing(true);
    pollStopAtRef.current = Date.now() + POLL_TOTAL_MS;

    const attempt = async () => {
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

        if (res.ok && json?.activated) {
          window.localStorage.removeItem(LAST_INVOICE_KEY);

          clearPoll();
          setIsSyncing(false);

          if (!redirectToLastResult()) {
            router.refresh();
          }
        }
      } catch {}
    };

    await attempt();
    pollTimerRef.current = setInterval(attempt, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const paid = url.searchParams.get("paid");

    if (paid === "1") {
      url.searchParams.delete("paid");
      window.history.replaceState({}, "", url.toString());
      startSilentPolling();
    }

    return () => clearPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden p-6 border border-white/10">
      <div className="text-center">
        <h1 className="text-3xl font-serif font-bold">Результат готовий ✅</h1>
        <p className="mt-2 text-gray-300">
          Відкрий повний опис і пояснення — це займе секунду.
        </p>
      </div>

      {/* What you get */}
      <div className="mt-5 rounded-2xl bg-black/30 border border-white/10 p-4 text-gray-200 text-sm space-y-2">
        <p>• Повний портрет твого архетипу (без урізань)</p>
        <p>• Пояснення “чому саме він/вона тобі підходить”</p>
        <p>• Твій % сумісності + логіка підбору</p>
      </div>

      {/* Preview (tease) */}
      <div className="mt-4 rounded-2xl bg-black/20 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-44 bg-white/10 rounded" />
          <div className="h-5 w-16 bg-white/10 rounded" />
        </div>
        <div className="h-32 bg-white/10 rounded mb-3" />
        <div className="flex gap-2 mb-3">
          <div className="h-8 w-24 bg-white/10 rounded" />
          <div className="h-8 w-28 bg-white/10 rounded" />
          <div className="h-8 w-20 bg-white/10 rounded" />
        </div>
        <div className="h-4 bg-white/10 rounded mb-2" />
        <div className="h-4 bg-white/10 rounded mb-2" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <p className="mt-3 text-xs text-gray-400">
          Це превʼю. Після оплати відкриється весь текст.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={async () => {
          if (isPaying || isSyncing) return;

          try {
            window.localStorage.removeItem(LAST_INVOICE_KEY);
          } catch {}

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

            try {
              const cur = new URL(window.location.href);
              const curQs = cur.searchParams.toString();
              if (curQs && curQs.includes("dominance=")) {
                window.localStorage.setItem(LAST_RESULT_QS_KEY, curQs);
              }
            } catch {}

            window.location.href = json.pageUrl;
          } catch {
            setIsPaying(false);
          }
        }}
        disabled={isPaying || isSyncing}
        className="mt-6 w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-xl text-lg disabled:opacity-60 transition"
      >
        {isSyncing
          ? "Підтверджуємо оплату..."
          : isPaying
          ? "Переадресація..."
          : `Відкрити повний результат — ${priceUah} грн`}
      </button>

      {/* Trust microcopy */}
      <div className="mt-3 text-center text-gray-400 text-xs space-y-1">
        <p>Після оплати результат відкриється автоматично.</p>
        <p>
          Натискаючи кнопку, ти погоджуєшся з{" "}
          <Link href="/offer" className="underline hover:text-gray-200">
            публічною офертою
          </Link>
          .
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="flex-1">
          <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold">
            На головну
          </button>
        </Link>
        <Link href="/test" className="flex-1">
          <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold">
            Пройти ще раз
          </button>
        </Link>
      </div>
    </div>
  );
}
