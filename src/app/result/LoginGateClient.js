// src/app/result/LoginGateClient.js
"use client";

import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginGateClient() {
  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden p-6">
      <h1 className="text-3xl font-serif font-bold">Результат готовий</h1>
      <p className="mt-3 text-gray-300">
        Увійди через обліковий запис Google, щоб продовжити.
      </p>

      {/* Тізер/скелетон — ок, лишаємо, але без приписок */}
      <div className="mt-4 rounded-xl bg-black/20 border border-white/10 p-4">
        <p className="text-sm text-gray-200 font-semibold">Залишився один крок:</p>

        <div className="mt-3">
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
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: window.location.href })}
        className="mt-6 w-full px-6 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-lg"
      >
        Увійти в акаунт Google
      </button>

      <div className="mt-6 flex gap-3">
        <Link href="/" className="flex-1">
          <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold">
            На головну
          </button>
        </Link>
        <Link href="/test" className="flex-1">
          <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
            Пройти тест
          </button>
        </Link>
      </div>
    </div>
  );
}
