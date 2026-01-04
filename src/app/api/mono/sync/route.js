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

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeStatus(s) {
  return String(s || "").trim().toLowerCase();
}

function toIntSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const email = String(session?.user?.email || "").trim().toLowerCase();
  if (!email) return jsonResponse({ error: "Not authenticated" }, 401);

  let body = {};
  try { body = await req.json(); } catch {}

  const invoiceId = String(body?.invoiceId || "").trim();
  if (!invoiceId) return jsonResponse({ error: "Missing invoiceId" }, 400);

  const token = process.env.MONO_MERCHANT_TOKEN;
  if (!token) return jsonResponse({ error: "Missing MONO_MERCHANT_TOKEN in env" }, 500);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, subscriptionActiveUntil: true, isPremium: true },
  });
  if (!user?.id) return jsonResponse({ error: "User not found" }, 404);

  const payment = await prisma.payment.findFirst({
    where: { invoiceId },
    select: { id: true, userId: true, amount: true, ccy: true, status: true, paidAt: true },
  });

  if (!payment) return jsonResponse({ error: "Payment not found for this invoiceId" }, 404);
  if (payment.userId !== user.id) return jsonResponse({ error: "Forbidden: invoice does not belong to this user" }, 403);

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
    return jsonResponse({ error: "Mono invoice status failed" }, 500);
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
    return jsonResponse({ error: "Mono response missing amount", status }, 500);
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

    return jsonResponse(
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
      400
    );
  }

  // if not success -> just persist status/payload
  if (status !== "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status, payload: monoJson },
    });
    return jsonResponse({ ok: true, activated: false, status }, 200);
  }

  // success but already activated -> ensure payment status/payload ok, return current user state
  if (alreadyActivated) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "success", payload: monoJson },
    });

    return jsonResponse(
      {
        ok: true,
        activated: true,
        status,
        subscriptionActiveUntil: user.subscriptionActiveUntil,
        note: "Already activated earlier",
      },
      200
    );
  }

  const now = new Date();
  const base =
    user.subscriptionActiveUntil && new Date(user.subscriptionActiveUntil) > now
      ? new Date(user.subscriptionActiveUntil)
      : now;

  const newUntil = addDays(base, 30);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "success",
        payload: monoJson,
        paidAt: payment.paidAt ?? now, // ✅ paidAt тільки 1 раз
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        isPremium: true,
        subscriptionActiveUntil: newUntil,
      },
    });
  });

  return jsonResponse(
    { ok: true, activated: true, status, subscriptionActiveUntil: newUntil },
    200
  );
}

export async function GET() {
  return new Response("OK", { status: 200 });
}
