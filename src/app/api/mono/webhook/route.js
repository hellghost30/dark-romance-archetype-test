// src/app/api/mono/webhook/route.js
import prisma from "@/lib/prisma";

const MONO_API_BASE = "https://api.monobank.ua/api/merchant";

async function verifyWebhookSignature({ rawBody, xSign, token }) {
  // Верифікація підпису через pubkey (ECDSA). Якщо щось не так — повернемо false.
  try {
    if (!xSign) return false;

    const pubRes = await fetch(`${MONO_API_BASE}/pubkey`, {
      method: "GET",
      headers: { "X-Token": token },
    });

    if (!pubRes.ok) return false;
    const pubKeyBase64 = await pubRes.text(); // base64-ключ
    if (!pubKeyBase64) return false;

    // Node crypto verify (SPKI ключ)
    const { createVerify } = await import("crypto");

    const pubKeyDer = Buffer.from(pubKeyBase64, "base64");

    // Mono повертає DER-публічний ключ. Для verify треба PEM/SPKI.
    // Робимо "-----BEGIN PUBLIC KEY-----" PEM з DER:
    const pem =
      "-----BEGIN PUBLIC KEY-----\n" +
      pubKeyDer.toString("base64").match(/.{1,64}/g).join("\n") +
      "\n-----END PUBLIC KEY-----\n";

    const signature = Buffer.from(xSign, "base64");

    const verifier = createVerify("SHA256");
    verifier.update(rawBody);
    verifier.end();

    return verifier.verify(pem, signature);
  } catch {
    return false;
  }
}

export async function POST(req) {
  const token = process.env.MONO_MERCHANT_TOKEN;
  if (!token) {
    return new Response("Missing token", { status: 500 });
  }

  const rawBody = await req.text();
  const xSign = req.headers.get("x-sign") || req.headers.get("X-Sign");

  // Якщо X-Sign є — верифікуємо (рекомендовано)
  if (xSign) {
    const ok = await verifyWebhookSignature({ rawBody, xSign, token });
    if (!ok) return new Response("Bad signature", { status: 401 });
  }

  let data = null;
  try { data = JSON.parse(rawBody); } catch {}

  const invoiceId = data?.invoiceId;
  const status = data?.status; // success / processing / created / expired / failure ...

  if (!invoiceId) return new Response("No invoiceId", { status: 400 });

  // Оновлюємо платіж
  const payment = await prisma.payment.findUnique({
    where: { invoiceId },
    select: { id: true, userId: true, status: true },
  });

  if (payment) {
    await prisma.payment.update({
      where: { invoiceId },
      data: {
        status: status || payment.status,
        webhookPayload: data, // якщо в тебе є таке поле; якщо ні — прибери цей рядок
      },
    });

    // Якщо успіх — активуємо преміум
    if (status === "success") {
      await prisma.user.update({
        where: { id: payment.userId },
        data: { isPremium: true },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
