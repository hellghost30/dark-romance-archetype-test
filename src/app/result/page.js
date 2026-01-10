// src/app/result/page.js
import React from "react";
import { cookies } from "next/headers";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

import PaywallClient from "./PaywallClient";
import ResultClient from "./ResultClient";

// BYPASS EMAILS
const BYPASS_EMAILS = (process.env.NEXT_PUBLIC_BYPASS_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// ✅ Ціна (грн)
const PRICE_UAH = Number(process.env.NEXT_PUBLIC_PRICE_UAH || 49);

// ✅ cookie, який ми будемо ставити після успішної оплати
// значення: timestamp (ms) до якого діє доступ
const PREMIUM_UNTIL_COOKIE = "df_premium_until";

function isPremiumByUser(user) {
  if (!user) return false;
  if (user.isPremium) return true;

  if (user.subscriptionActiveUntil) {
    const until = new Date(user.subscriptionActiveUntil).getTime();
    if (Number.isFinite(until) && until > Date.now()) return true;
  }
  return false;
}

function isPremiumByCookie() {
  try {
    const c = cookies();
    const raw = c.get(PREMIUM_UNTIL_COOKIE)?.value;
    if (!raw) return false;

    const untilMs = Number(raw);
    if (!Number.isFinite(untilMs)) return false;

    return untilMs > Date.now();
  } catch {
    return false;
  }
}

export default async function ResultPage() {
  // 1) Спочатку пробуємо cookie (анонімний доступ)
  const premiumFromCookie = isPremiumByCookie();

  // 2) Якщо людина залогінена — зберігаємо стару логіку (bypass + БД)
  const session = await getServerSession(authOptions);

  let premiumFromAccount = false;

  if (session?.user?.email) {
    const email = String(session.user.email || "").trim().toLowerCase();
    const isBypassUser = Boolean(email && BYPASS_EMAILS.includes(email));

    const user = await prisma.user.findUnique({
      where: { email },
      select: { isPremium: true, subscriptionActiveUntil: true },
    });

    premiumFromAccount = isBypassUser || isPremiumByUser(user);
  }

  const premium = premiumFromCookie || premiumFromAccount;

  // 3) Якщо нема доступу — показуємо paywall (БЕЗ логіну)
  if (!premium) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
        <PaywallClient priceUah={PRICE_UAH} />
      </main>
    );
  }

  // 4) Є доступ → повний результат
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
      <ResultClient />
    </main>
  );
}
