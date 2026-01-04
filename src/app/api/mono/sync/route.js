// src/app/api/mono/sync/route.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MONO_API_BASE = "https://api.monobank.ua/api/merchant";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const emailRaw = session?.user?.email;
  const email = (emailRaw || "").trim().toLowerCase();

  if (!email) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {}

  const invoiceId = String(body?.invoiceId || "").trim();
  if (!invoiceId) {
    return new Response(JSON.stringify({ error: "Missing invoiceId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = process.env.MONO_MERCHANT_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing MONO_MERCHANT_TOKEN in env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1) дістаємо юзера
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, subscriptionActiveUntil: true },
  });

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2) знаходимо payment по invoiceId (має існувати) і перевіряємо owner
  const payment = await prisma.payment.findFirst({
    where: { invoiceId },
    select: { id: true, userId: true, amount: true, ccy: true, status: true },
  });

  if (!payment) {
    return new Response(JSON.stringify({ error: "Payment not found for this invoiceId" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (payment.userId !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden: invoice does not belong to this user" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3) питаємо Mono статус інвойсу
  const url = `${MONO_API_BASE}/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`;

  const monoRes = await fetch(url, {
    method: "GET",
    headers: { "X-Token": token },
  });

  const monoJson = await monoRes.json().catch(() => null);

  if (!monoRes.ok) {
    return new Response(
      JSON.stringify({ error: "Mono invoice status failed", details: monoJson }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const status = String(monoJson?.status || "").toLowerCase();

  // 4) звіряємо суму/валюту (захист від “оплатив інше → активував”)
  const monoAmount = Number(monoJson?.amount);
  const monoCcy = Number(monoJson?.ccy);

  if (!Number.isFinite(monoAmount) || monoAmount <= 0) {
    // все одно оновимо payload/status для дебагу
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status, payload: monoJson },
    });
    return new Response(JSON.stringify({ error: "Mono response missing amount", status }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // якщо mono не віддасть ccy — не блокуєм, але якщо віддасть, звіряємо
  const ccyMismatch = Number.isFinite(monoCcy) && monoCcy !== Number(payment.ccy);
  const amountMismatch = monoAmount !== Number(payment.amount);

  if (amountMismatch || ccyMismatch) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "mismatch", payload: monoJson },
    });

    return new Response(
      JSON.stringify({
        ok: false,
        activated: false,
        error: "Invoice mismatch",
        details: {
          expectedAmount: payment.amount,
          gotAmount: monoAmount,
          expectedCcy: payment.ccy,
          gotCcy: Number.isFinite(monoCcy) ? monoCcy : null,
          status,
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5) оновлюємо payment статус + payload
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status, payload: monoJson },
  });

  if (status !== "success") {
    return new Response(
      JSON.stringify({ ok: true, activated: false, status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // 6) активуємо підписку (30 днів)
  const now = new Date();
  const base =
    user.subscriptionActiveUntil && new Date(user.subscriptionActiveUntil) > now
      ? new Date(user.subscriptionActiveUntil)
      : now;

  const newUntil = addDays(base, 30);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPremium: true, // залишаємо для сумісності
      subscriptionActiveUntil: newUntil,
    },
  });

  return new Response(
    JSON.stringify({ ok: true, activated: true, status, subscriptionActiveUntil: newUntil }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function GET() {
  return new Response("OK", { status: 200 });
}
