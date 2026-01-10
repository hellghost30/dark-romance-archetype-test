// src/app/api/mono/sync/route.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const MONO_API_BASE = "https://api.monobank.ua/api/merchant";

const PREMIUM_UNTIL_COOKIE = "df_premium_until";
const DAYS_ACCESS = 30;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeStatus(s) {
  return String(s || "").trim().toLowerCase();
}

function toIntSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function withPremiumCookie(res, untilDate) {
  const untilMs = new Date(untilDate).getTime();
  const maxAge = Math.max(0, Math.floor((untilMs - Date.now()) / 1000));

  res.cookies.set(PREMIUM_UNTIL_COOKIE, String(untilMs), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge, // сек
  });

  return res;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const email = String(session?.user?.email || "").trim().toLowerCase() || null;

  let body = {};
  try {
    body = await req.json();
  } catch {}

  const invoiceId = String(body?.invoiceId || "").trim();
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  const token = process.env.MONO_MERCHANT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Missing MONO_MERCHANT_TOKEN in env" }, { status: 500 });
  }

  // payment must exist
  const payment = await prisma.payment.findFirst({
    where: { invoiceId },
    select: {
      id: true,
      userId: true,
      amount: true,
      ccy: true,
      status: true,
      paidAt: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found for this invoiceId" }, { status: 404 });
  }

  // if logged-in, optionally verify ownership and load user
  let user = null;

  if (email) {
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, subscriptionActiveUntil: true, isPremium: true },
    });

    // якщо payment прив’язаний до юзера — перевіряємо, що це той самий
    if (payment.userId && user?.id && payment.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: invoice does not belong to this user" }, { status: 403 });
    }
  }

  const alreadyActivated = normalizeStatus(payment.status) === "success";

  const url = `${MONO_API_BASE}/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`;
  const monoRes = await fetch(url, {
    method: "GET",
    headers: { "X-Token": token },
  });

  const monoJson = await monoRes.json().catch(() => null);

  if (!monoRes.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "mono_error", payload: monoJson },
    });
    return NextResponse.json({ error: "Mono invoice status failed" }, { status: 500 });
  }

  const status = normalizeStatus(monoJson?.status);

  // amount/ccy check
  const monoAmount = toIntSafe(monoJson?.paidAmount) ?? toIntSafe(monoJson?.amount);
  const monoCcy = toIntSafe(monoJson?.ccy);

  if (!Number.isFinite(monoAmount) || monoAmount <= 0) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status, payload: monoJson },
    });
    return NextResponse.json({ error: "Mono response missing amount", status }, { status: 500 });
  }

  const expectedAmount = Number(payment.amount);
  const expectedCcy = Number(payment.ccy);

  const amountMismatch = monoAmount !== expectedAmount;
  const ccyMismatch = Number.isFinite(monoCcy) ? monoCcy !== expectedCcy : false;

  if (amountMismatch || ccyMismatch) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "mismatch", payload: monoJson },
    });

    return NextResponse.json(
      {
        ok: false,
        activated: false,
        error: "Invoice mismatch",
        details: {
          expectedAmount,
          gotAmount: monoAmount,
          expectedCcy,
          gotCcy: Number.isFinite(monoCcy) ? monoCcy : null,
          status,
        },
      },
      { status: 400 }
    );
  }

  // if not success -> persist status/payload
  if (status !== "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status, payload: monoJson },
    });
    return NextResponse.json({ ok: true, activated: false, status }, { status: 200 });
  }

  // ✅ SUCCESS: ставимо cookie доступу (навіть якщо без логіну)
  const now = new Date();

  // якщо вже activated — просто оновимо payment payload і поставимо cookie
  if (alreadyActivated) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "success", payload: monoJson },
    });

    // cookie until:
    // 1) якщо є user.subscriptionActiveUntil — беремо його
    // 2) інакше paidAt + 30
    // 3) інакше now + 30
    const until =
      (user?.subscriptionActiveUntil && new Date(user.subscriptionActiveUntil)) ||
      (payment.paidAt && addDays(payment.paidAt, DAYS_ACCESS)) ||
      addDays(now, DAYS_ACCESS);

    let res = NextResponse.json(
      {
        ok: true,
        activated: true,
        status,
        subscriptionActiveUntil: user?.subscriptionActiveUntil ?? null,
        cookieUntil: until,
        note: "Already activated earlier",
      },
      { status: 200 }
    );
    res = withPremiumCookie(res, until);
    return res;
  }

  // NEW activation
  let newUntil = addDays(now, DAYS_ACCESS);

  // якщо юзер залогінений — робимо як раніше “продовження” від поточної дати
  if (user?.id) {
    const base =
      user.subscriptionActiveUntil && new Date(user.subscriptionActiveUntil) > now
        ? new Date(user.subscriptionActiveUntil)
        : now;
    newUntil = addDays(base, DAYS_ACCESS);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "success",
        payload: monoJson,
        paidAt: payment.paidAt ?? now, // paidAt only once
      },
    });

    // апдейтимо юзера тільки якщо він існує (залишаємо сумісність зі старим режимом)
    if (user?.id) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          isPremium: true,
          subscriptionActiveUntil: newUntil,
        },
      });
    }
  });

  let res = NextResponse.json(
    {
      ok: true,
      activated: true,
      status,
      subscriptionActiveUntil: user?.id ? newUntil : null,
      cookieUntil: newUntil,
      mode: user?.id ? "account+cookie" : "cookie",
    },
    { status: 200 }
  );

  res = withPremiumCookie(res, newUntil);
  return res;
}

export async function GET() {
  return new Response("OK", { status: 200 });
}
