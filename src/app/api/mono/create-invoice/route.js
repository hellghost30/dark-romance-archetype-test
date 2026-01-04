// src/app/api/mono/create-invoice/route.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MONO_API_BASE = "https://api.monobank.ua/api/merchant";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function ensurePaidRedirectUrl(rawSuccessUrl) {
  // Треба, щоб після оплати ми гарантовано попадали на /result?paid=1
  // Якщо successUrl вже має query — просто додаємо paid=1 (не затираємо інше).
  try {
    const u = new URL(rawSuccessUrl);
    if (!u.searchParams.get("paid")) u.searchParams.set("paid", "1");
    return u.toString();
  } catch {
    // якщо раптом не абсолютний URL — повертаємо як є (але краще щоб був абсолютний)
    if (String(rawSuccessUrl).includes("?")) {
      return String(rawSuccessUrl) + "&paid=1";
    }
    return String(rawSuccessUrl) + "?paid=1";
  }
}

export async function POST(req) {
  // 0) auth
  const session = await getServerSession(authOptions);
  const email = String(session?.user?.email || "").trim().toLowerCase();
  if (!email) return jsonResponse({ error: "Not authenticated" }, 401);

  // 1) input
  let body = {};
  try {
    body = await req.json();
  } catch {}

  const amountUahRaw = body?.amountUah ?? process.env.NEXT_PUBLIC_PRICE_UAH ?? 49;
  const amountUah = Number(amountUahRaw);

  if (!Number.isFinite(amountUah) || amountUah <= 0) {
    return jsonResponse({ error: "Invalid amount" }, 400);
  }

  // 2) env
  const token = process.env.MONO_MERCHANT_TOKEN;
  const webHookUrl = process.env.MONO_WEBHOOK_URL; // можна лишити навіть якщо не юзаєш
  const successUrlRaw = process.env.MONO_SUCCESS_URL;

  if (!token) return jsonResponse({ error: "Missing MONO_MERCHANT_TOKEN in env" }, 500);
  if (!webHookUrl) return jsonResponse({ error: "Missing MONO_WEBHOOK_URL in env" }, 500);
  if (!successUrlRaw) return jsonResponse({ error: "Missing MONO_SUCCESS_URL in env" }, 500);

  const successUrl = ensurePaidRedirectUrl(successUrlRaw);

  // 3) user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user?.id) return jsonResponse({ error: "User not found" }, 404);

  // 4) build invoice payload
  // amount в копійках
  const amountKop = Math.max(1, Math.round(amountUah * 100));

  // reference треба для внутрішньої ідентифікації (не плутати з invoiceId)
  const reference = `sub_${user.id}_${Date.now()}`;

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
    webHookUrl,
    validity: 3600,
  };

  // 5) call mono
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
    return jsonResponse({ error: "Mono invoice create failed", details: monoJson }, 500);
  }

  const invoiceId = monoJson?.invoiceId;
  const pageUrl = monoJson?.pageUrl;

  if (!invoiceId || !pageUrl) {
    return jsonResponse(
      { error: "Mono response missing invoiceId/pageUrl", details: monoJson },
      500
    );
  }

  // 6) persist payment (owner binding важливий для sync)
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

  return jsonResponse({ pageUrl, invoiceId }, 200);
}

export async function GET() {
  return new Response("OK", { status: 200 });
}
