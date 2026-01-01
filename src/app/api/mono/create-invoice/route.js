// src/app/api/mono/create-invoice/route.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

const MONO_API_BASE = "https://api.monobank.ua/api/merchant";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").trim().toLowerCase();

  if (!email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const amountUah = Number(body?.amountUah ?? 49);
  if (!Number.isFinite(amountUah) || amountUah <= 0) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }

  const token = process.env.MONO_MERCHANT_TOKEN;
  const redirectUrl = process.env.MONO_REDIRECT_URL;
  const successUrl = process.env.MONO_SUCCESS_URL;
  const failUrl = process.env.MONO_FAIL_URL;
  const webHookUrl = process.env.MONO_WEBHOOK_URL;

  if (!token) return Response.json({ error: "Missing MONO_MERCHANT_TOKEN" }, { status: 500 });
  if (!redirectUrl) return Response.json({ error: "Missing MONO_REDIRECT_URL" }, { status: 500 });
  if (!successUrl) return Response.json({ error: "Missing MONO_SUCCESS_URL" }, { status: 500 });
  if (!failUrl) return Response.json({ error: "Missing MONO_FAIL_URL" }, { status: 500 });
  if (!webHookUrl) return Response.json({ error: "Missing MONO_WEBHOOK_URL" }, { status: 500 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user?.id) return Response.json({ error: "User not found" }, { status: 404 });

  // ✅ унікальний reference (і будемо його ж класти в comment)
  const reference = `sub_${user.id}_${Date.now()}`;

  // ✅ amount в копійках (мін. одиницях) — як в докі
  const amountKop = Math.round(amountUah * 100);

  const payload = {
    amount: amountKop,
    ccy: 980,
    merchantPaymInfo: {
      reference,
      destination: "Dark Finder — підписка на 1 місяць",
      comment: reference, // ✅ унікальний коментар для трекінгу
      basketOrder: [
        {
          name: "Підписка на 1 місяць",
          qty: 1,
          sum: amountKop,
          total: amountKop,
          unit: "шт.",
          code: "SUBSCRIPTION_30D",
        },
      ],
    },
    redirectUrl, // GET після завершення (успіх або помилка)
    successUrl,  // GET лише при success
    failUrl,     // GET лише при fail
    webHookUrl,  // POST callback при зміні статусів (крім expired)
    validity: 3600,
    paymentType: "debit",
  };

  const monoRes = await fetch(`${MONO_API_BASE}/invoice/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Token": token,
    },
    body: JSON.stringify(payload),
  });

  const monoJson = await monoRes.json().catch(() => null);

  if (!monoRes.ok) {
    return Response.json(
      { error: "Mono invoice create failed", details: monoJson },
      { status: monoRes.status || 500 }
    );
  }

  const invoiceId = monoJson?.invoiceId;
  const pageUrl = monoJson?.pageUrl;
  if (!invoiceId || !pageUrl) {
    return Response.json({ error: "Missing invoiceId/pageUrl", details: monoJson }, { status: 500 });
  }

  await prisma.payment.create({
    data: {
      userId: user.id,
      invoiceId,
      reference,
      amount: amountKop,
      ccy: 980,
      status: "created",
      payload: monoJson,
    },
  });

  return Response.json({ pageUrl, invoiceId, reference }, { status: 200 });
}

export async function GET() {
  return new Response("OK", { status: 200 });
}
