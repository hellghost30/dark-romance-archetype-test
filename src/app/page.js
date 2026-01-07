// src/app/page.js
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "partnerGender";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [partnerGender, setPartnerGender] = useState(null); // 'male' | 'female' | null

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "male" || saved === "female") setPartnerGender(saved);
  }, []);

  const choosePartner = (g) => {
    setPartnerGender(g);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, g);
  };

  const handleStart = () => {
    let g = partnerGender;
    if (!g && typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "male" || saved === "female") g = saved;
    }
    if (!g) return;

    router.push("/test");
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-gray-900 text-white p-6">
        <p className="text-base text-gray-300 animate-pulse">Завантаження...</p>
      </main>
    );
  }

  const selectedLabel =
    partnerGender === "male" ? "чоловіка" : partnerGender === "female" ? "жінку" : null;

  const heroTitle =
    partnerGender === "male"
      ? "Який тип чоловіка тобі реально підходить?"
      : partnerGender === "female"
      ? "Який тип жінки тобі реально підходить?"
      : "Хто тобі реально підходить?";

  return (
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-gray-900 text-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: "#E9D5D5" }}>
            Dark Finder
          </h1>

          <p className="mt-2 text-sm sm:text-base text-gray-300 leading-relaxed">
            {heroTitle} <span className="text-gray-200 font-semibold">Тест на 2 хвилини</span> — результат одразу після проходження.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-300">
            <div className="rounded-xl bg-black/25 border border-white/10 px-2 py-2">
              Портрет персонажа
            </div>
            <div className="rounded-xl bg-black/25 border border-white/10 px-2 py-2">
              % сумісності
            </div>
            <div className="rounded-xl bg-black/25 border border-white/10 px-2 py-2">
              Чому підходить саме тобі
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Зараз проходять тест сотні людей — спробуй і ти.
          </p>

          {/* Логін/логаут */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {session ? (
              <>
                <span className="text-xs text-gray-400">
                  Увійшов як <span className="text-gray-200 font-semibold">{session.user?.name || "користувач"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700"
                >
                  Вийти
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="text-xs px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700"
              >
                Увійти
              </button>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-gray-800 bg-black/30 shadow-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-serif">Кого ти шукаєш?</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Обери — і ми підберемо архетип з потрібної категорії.
                </p>
              </div>

              {selectedLabel && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-red-900/30 border border-red-900/40 px-3 py-1 text-xs text-red-200">
                  Обрано: {selectedLabel}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => choosePartner("male")}
                className={
                  "rounded-xl px-4 py-3 text-sm font-bold transition active:scale-[0.99] " +
                  (partnerGender === "male"
                    ? "bg-red-800 text-white shadow-lg shadow-red-900/20"
                    : "bg-gray-800 hover:bg-gray-700 text-white")
                }
              >
                Чоловіка
              </button>

              <button
                type="button"
                onClick={() => choosePartner("female")}
                className={
                  "rounded-xl px-4 py-3 text-sm font-bold transition active:scale-[0.99] " +
                  (partnerGender === "female"
                    ? "bg-red-800 text-white shadow-lg shadow-red-900/20"
                    : "bg-gray-800 hover:bg-gray-700 text-white")
                }
              >
                Жінку
              </button>
            </div>

            {!partnerGender && (
              <p className="mt-3 text-xs text-gray-500">
                Спочатку обери варіант — і кнопка стане активною.
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="p-5 border-t border-gray-800 bg-black/20">
            <button
              type="button"
              onClick={handleStart}
              disabled={!partnerGender}
              className={
                "w-full rounded-xl px-5 py-3 text-base font-bold transition active:scale-[0.99] " +
                (partnerGender
                  ? "bg-red-800 hover:bg-red-700 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed")
              }
            >
              {partnerGender ? "Побачити мій результат" : "Обери варіант вище"}
            </button>

            <p className="mt-3 text-[11px] text-gray-500 text-center">
              Без реєстрації. Результат сформується одразу після тесту.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
