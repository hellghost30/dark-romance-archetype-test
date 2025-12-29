// src/app/api/liqpay/checkout/route.js
import crypto from "crypto";

function b64(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

function liqpaySignature(privateKey, data) {
  // signature = base64( sha1(private_key + data + private_key) )
  const signStr = `${privateKey}${data}${privateKey}`;
  const sha1 = crypto.createHash("sha1").update(signStr).digest("base64");
  return sha1;
}

export async function POST(req) {
  try {
    const public_key = process.env.LIQPAY_PUBLIC_KEY;
    const private_key = process.env.LIQPAY_PRIVATE_KEY;

    if (!public_key || !private_key) {
      return new Response(
        JSON.stringify({ error: "Missing LIQPAY_PUBLIC_KEY/LIQPAY_PRIVATE_KEY in env" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));

    const amount = Number(body?.amount ?? process.env.NEXT_PUBLIC_PRICE_UAH ?? 49);
    const currency = body?.currency || "UAH";

    // Унікальний order_id (можеш потім прив’язати до юзера/сесії/платежу)
    const order_id =
      body?.order_id ||
      `order_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const description = body?.description || "Dark Romance — Premium access";

    // Базовий URL сайту (на Render буде NEXTAUTH_URL)
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://dark-romance-archetype-test.onrender.com";

    // Куди редіректити після оплати (можеш змінити під свою сторінку)
    const result_url = body?.result_url || `${baseUrl}/result`;

    // Callback (server_url) — сюди LiqPay шле статус (пізніше зробимо обробник)
    const server_url = body?.server_url || `${baseUrl}/api/liqpay/callback`;

    const payload = {
      public_key,
      version: "3",
      action: "pay",
      amount,
      currency,
      description,
      order_id,
      result_url,
      server_url,

      // sandbox-режим для тестових ключів
      sandbox: 1,
    };

    const data = b64(JSON.stringify(payload));
    const signature = liqpaySignature(private_key, data);

    return new Response(
      JSON.stringify({
        ok: true,
        data,
        signature,
        order_id,
        amount,
        currency,
        result_url,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Checkout error", details: String(e?.message || e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
