// src/app/page.js (оновлена, робоча версія)
'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "partnerGender";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [partnerGender, setPartnerGender] = useState(null); // 'male' | 'female' | null

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'male' || saved === 'female') setPartnerGender(saved);
  }, []);

  const choosePartner = (g) => {
    setPartnerGender(g);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, g);
  };

  const handleStart = () => {
    // ✅ Не даємо старт без вибору
    if (!partnerGender) return;

    if (session) {
      router.push('/test');
    } else {
      // ✅ Після входу теж піде на /test (вибір вже збережений в localStorage)
      signIn('google', { callbackUrl: '/test' });
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
        <p className="text-xl animate-pulse">Завантаження сесії...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-red-300" style={{ color: '#E9D5D5' }}>
          Dark Romance Partner Finder
        </h1>

        <p className="mt-4 text-lg text-gray-300">
          Пройди тест і дізнайся, який темний персонаж з книжок та фільмів підходить саме тобі.
        </p>

        {/* ✅ Вибір "кого шукаю" ДО старту */}
        <div className="mt-8 w-full max-w-md mx-auto bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-serif mb-2">Кого ти шукаєш?</h2>
          <p className="text-gray-300 mb-5 text-sm">
            Це впливає на те, з якої категорії персонажів буде підібрано результат.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => choosePartner('male')}
              className={
                "px-6 py-3 rounded-lg font-bold text-lg transition " +
                (partnerGender === 'male'
                  ? "bg-red-800 hover:bg-red-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white")
              }
            >
              Чоловіка
            </button>

            <button
              onClick={() => choosePartner('female')}
              className={
                "px-6 py-3 rounded-lg font-bold text-lg transition " +
                (partnerGender === 'female'
                  ? "bg-red-800 hover:bg-red-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white")
              }
            >
              Жінку
            </button>
          </div>

          {partnerGender && (
            <p className="mt-4 text-xs text-gray-400">
              Обрано: {partnerGender === 'male' ? 'чоловік' : 'жінка'}
            </p>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={!partnerGender}
          className={
            "mt-8 px-8 py-3 font-bold rounded-lg text-xl transition-transform transform " +
            (partnerGender
              ? "bg-red-800 hover:bg-red-700 text-white hover:scale-105"
              : "bg-gray-700 text-gray-400 cursor-not-allowed")
          }
        >
          {session ? "Почати тест" : "Увійти та Почати тест"}
        </button>

        {!partnerGender && (
          <p className="mt-3 text-sm text-gray-400">
            Спочатку обери, кого ти шукаєш.
          </p>
        )}

        {session && (
          <>
            <p className="mt-4 text-sm text-gray-400">
              Вітаємо, {session.user.name}!
            </p>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold"
            >
              Вийти з акаунта
            </button>
          </>
        )}
      </div>
    </main>
  );
}
