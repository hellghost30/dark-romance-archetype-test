// src/app/api/mono/create-invoice/route.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MONO_API_BASE = "https://api.monobank.ua/api/merchant";

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

  const amountUah = Number(body?.amountUah ?? process.env.NEXT_PUBLIC_PRICE_UAH ?? 49);
  if (!Number.isFinite(amountUah) || amountUah <= 0) {
    return new Response(JSON.stringify({ error: "Invalid amount" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = process.env.MONO_MERCHANT_TOKEN;
  const webHookUrl = process.env.MONO_WEBHOOK_URL;
  const successUrl = process.env.MONO_SUCCESS_URL;

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing MONO_MERCHANT_TOKEN in env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!webHookUrl) {
    return new Response(JSON.stringify({ error: "Missing MONO_WEBHOOK_URL in env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!successUrl) {
    return new Response(JSON.stringify({ error: "Missing MONO_SUCCESS_URL in env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user?.id) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reference = `sub_${user.id}_${Date.now()}`;
  const amountKop = Math.round(amountUah * 100);

  const payload = {
    amount: amountKop,
    ccy: 980,
    merchantPaymInfo: {
      reference,
      destination: "Dark Finder — підписка на 1 місяць",
      comment: "Підписка на 1 місяць (безлімітні проходження тесту)",
      basketOrder: [
        { name: "Підписка на 1 місяць", qty: 1, sum: amountKop, code: "SUBSCRIPTION_30D" },
      ],
    },
    redirectUrl: successUrl,
    webHookUrl: webHookUrl,
    validity: 3600,
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
    return new Response(
      JSON.stringify({ error: "Mono invoice create failed", details: monoJson }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const invoiceId = monoJson?.invoiceId;
  const pageUrl = monoJson?.pageUrl;

  if (!invoiceId || !pageUrl) {
    return new Response(
      JSON.stringify({ error: "Mono response missing invoiceId/pageUrl", details: monoJson }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
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

  return new Response(JSON.stringify({ pageUrl, invoiceId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// (не обов'язково, але корисно для браузера)
export async function GET() {
  return new Response("OK", { status: 200 });
}
