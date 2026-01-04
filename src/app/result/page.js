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

export default async function ResultPage() {
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

  // 3) paywall (без тізерів)
  if (!premium) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-800 p-4">
        <PaywallClient priceUah={PRICE_UAH} />
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
