// src/app/api/mono/webhook/route.js
import prisma from "@/lib/prisma";

// підписку даємо на 30 днів
const DAYS = 30;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(req) {
  // TODO (рекомендовано): перевірка підпису X-Sign (ECDSA) через MONO_PUBLIC_KEY
  // Поки що: обробляємо payload, щоб ти міг протестити end-to-end.

  let data = null;
  try {
    data = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const invoiceId = data?.invoiceId;
  const status = data?.status; // очікуємо "success" при успішній оплаті

  if (!invoiceId) return new Response("Missing invoiceId", { status: 400 });

  // Знаходимо Payment
  const payment = await prisma.payment.findUnique({
    where: { invoiceId },
    include: { user: true },
  });

  if (!payment) {
    // якщо немає такого invoiceId у нас — ігноруємо
    return new Response("OK", { status: 200 });
  }

  // Оновлюємо payment payload / status
  const newStatus = status || "unknown";

  // якщо вже успішно оброблено — ідемпотентність
  if (payment.status === "success") {
    await prisma.payment.update({
      where: { invoiceId },
      data: { payload: data },
    });
    return new Response("OK", { status: 200 });
  }

  // Записуємо статус
  await prisma.payment.update({
    where: { invoiceId },
    data: {
      status: newStatus,
      payload: data,
      paidAt: newStatus === "success" ? new Date() : null,
    },
  });

  // Якщо не success — нічого не активуємо
  if (newStatus !== "success") {
    return new Response("OK", { status: 200 });
  }

  // ✅ Активуємо підписку: subscriptionActiveUntil = max(now, current) + 30 days
  const now = new Date();
  const currentUntil = payment.user?.subscriptionActiveUntil
    ? new Date(payment.user.subscriptionActiveUntil)
    : null;

  const base = currentUntil && currentUntil > now ? currentUntil : now;
  const newUntil = addDays(base, DAYS);

  await prisma.user.update({
    where: { id: payment.userId },
    data: {
      subscriptionActiveUntil: newUntil,
      isPremium: true, // можеш лишити як сумісність
    },
  });

  return new Response("OK", { status: 200 });
}
