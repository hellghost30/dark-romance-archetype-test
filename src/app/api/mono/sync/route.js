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

  // 2) питаємо Mono статус інвойсу
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

  // у Mono статус зазвичай в полі status (success / processing / created / expired / failure ...)
  const status = String(monoJson?.status || "").toLowerCase();

  // 3) оновлюємо payment в БД (якщо є)
  // (не ламаємось, якщо запису нема)
  try {
    await prisma.payment.updateMany({
      where: { invoiceId },
      data: { status, payload: monoJson },
    });
  } catch {}

  if (status !== "success") {
    return new Response(
      JSON.stringify({ ok: true, activated: false, status }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4) активуємо підписку (30 днів)
  // якщо вже була активна в майбутньому — продовжуємо від тієї дати
  const base = user.subscriptionActiveUntil && new Date(user.subscriptionActiveUntil) > new Date()
    ? new Date(user.subscriptionActiveUntil)
    : new Date();

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
