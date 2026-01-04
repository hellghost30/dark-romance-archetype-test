// src/app/result/page.js
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

import LoginGateClient from "./LoginGateClient";
import PaywallClient from "./PaywallClient";
import ResultClient from "./ResultClient";

// BYPASS EMAILS
const BYPASS_EMAILS = (process.env.NEXT_PUBLIC_BYPASS_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// ✅ Ціна підписки (грн)
const PRICE_UAH = Number(process.env.NEXT_PUBLIC_PRICE_UAH || 49);

function isPremiumByUser(user) {
  if (!user) return false;
  if (user.isPremium) return true;

  if (user.subscriptionActiveUntil) {
    const until = new Date(user.subscriptionActiveUntil).getTime();
    if (Number.isFinite(until) && until > Date.now()) return true;
  }
  return false;
}

function pickNeutralInsightsFromQuery(searchParams) {
  const getInt = (k) => {
    const v = searchParams?.[k];
    const s = Array.isArray(v) ? v[0] : v;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  };

  const dominance = getInt("dominance");
  const empathy = getInt("empathy");
  const darkness = getInt("darkness");
  const chaos = getInt("chaos");

  const lines = [];

  if (dominance !== null) {
    if (dominance >= 70) lines.push("У тебе відчутна потреба керувати темпом і правилами взаємодії.");
    else if (dominance <= 35) lines.push("Тобі комфортніше, коли ініціатива розподіляється м’яко і без тиску.");
  }

  if (darkness !== null) {
    if (darkness >= 70) lines.push("Тебе сильніше чіпляють інтенсивні сюжети та емоційна глибина.");
    else if (darkness <= 35) lines.push("Ти краще реагуєш на теплоту й стабільність, без зайвого драматизму.");
  }

  if (empathy !== null) {
    if (empathy >= 70) lines.push("Ти тонко зчитуєш стан партнера — важливо мати взаємність.");
    else if (empathy <= 35) lines.push("Тобі важливі прямі сигнали: без натяків і гри у здогадки.");
  }

  if (chaos !== null) {
    if (chaos >= 70) lines.push("Тобі цікавіші непередбачувані люди, але межі мають бути чіткими.");
    else if (chaos <= 35) lines.push("Ти цінуєш прогнозованість: ясність, рутину та надійність у діях.");
  }

  if (lines.length < 2) {
    lines.push("Твій результат уже готовий — залишилось розблокувати деталі.");
    lines.push("Після оплати відкриються портрет, сумісність і пояснення “чому саме він/вона”.");
  }

  return lines.slice(0, 2);
}

export default async function ResultPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  // 1) Авторизація перед результатом (але НЕ автоперекидання)
  if (!session?.user?.email) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
        <LoginGateClient />
      </main>
    );
  }

  const email = String(session.user.email || "").trim().toLowerCase();
  const isBypassUser = Boolean(email && BYPASS_EMAILS.includes(email));

  // 2) user з БД (може бути null у рідкісних кейсах)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { isPremium: true, subscriptionActiveUntil: true },
  });

  const premium = isBypassUser || isPremiumByUser(user);

  // 3) paywall + teaser
  if (!premium) {
    const neutralInsights = pickNeutralInsightsFromQuery(searchParams || {});
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
        <PaywallClient priceUah={PRICE_UAH} neutralInsights={neutralInsights} />
      </main>
    );
  }

  // 4) premium → повний результат
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
      <ResultClient />
    </main>
  );
}
