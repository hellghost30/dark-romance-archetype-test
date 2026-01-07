// src/app/page.js
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "partnerGender";

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [partnerGender, setPartnerGender] = useState(null);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    setLiveCount(randInt(5, 100));
    const t = setInterval(() => setLiveCount(randInt(5, 100)), 2500);
    return () => clearInterval(t);
  }, []);

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

  const selectedLabel = partnerGender === "male" ? "чоловіка" : partnerGender === "female" ? "жінку" : null;

  return (
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-gray-900 text-white px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: "#E9D5D5" }}>
            Dark Finder
          </h1>

          <p className="mt-2 text-sm sm:text-base text-gray-300 leading-relaxed">
            Дізнайся, який темний персонаж з книжок та фільмів підходить саме тобі.
          </p>

          <div className="mt-3 text-xs text-gray-400">
            Зараз проходять тест:{" "}
            <span className="text-gray-200 font-bold">{liveCount}</span>
          </div>

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
              <p className="mt-3 text-xs text-gray-500">Спочатку обери варіант — і кнопка старту стане активною.</p>
            )}
          </div>

          <div className="p-5 border-t border-gray-800 bg-black/20">
            <button
              type="button"
              onClick={handleStart}
              disabled={!partnerGender}
              className={
                "w-full rounded-xl px-5 py-3 text-base font-bold transition active:scale-[0.99] " +
                (partnerGender ? "bg-red-800 hover:bg-red-700 text-white" : "bg-gray-800 text-gray-500 cursor-not-allowed")
              }
            >
              Побачити мій результат
            </button>

            <p className="mt-2 text-center text-xs text-gray-500">
              Результат формується одразу після тесту.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
