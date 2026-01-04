// src/app/page.js (оновлена під новий флоу: тест без логіну, логін перед результатом)
"use client";

import { useSession } from "next-auth/react";
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
    if (!partnerGender) return;
    // ✅ ТЕСТ БЕЗ ЛОГІНУ
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

  return (
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-gray-900 text-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: "#E9D5D5" }}>
            Dark Romance Partner Finder
          </h1>

          <p className="mt-2 text-sm sm:text-base text-gray-300 leading-relaxed">
            Пройди тест і дізнайся, який темний персонаж з книжок та фільмів підходить саме тобі.
          </p>

          {session && (
            <p className="mt-2 text-xs text-gray-400">
              Привіт, <span className="font-semibold text-gray-200">{session.user?.name || "користувачу"}</span> 👀
            </p>
          )}
        </div>

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-gray-800 bg-black/30 shadow-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-serif">Кого ти шукаєш?</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Це впливає на те, з якої категорії персонажів буде підібрано результат.
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
                Спочатку обери варіант — і кнопка старту стане активною.
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="p-5 border-t border-gray-800 bg-black/20">
            <button
              onClick={handleStart}
              disabled={!partnerGender}
              className={
                "w-full rounded-xl px-5 py-3 text-base font-bold transition active:scale-[0.99] " +
                (partnerGender
                  ? "bg-red-800 hover:bg-red-700 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed")
              }
            >
              Почати тест
            </button>

            <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
              Натискаючи кнопку, ти погоджуєшся з умовами сервісу (див. посилання внизу сторінки).
            </p>

            {!session && (
              <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                *Увійти через Google потрібно буде вже перед відкриттям результату.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
