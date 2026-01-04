// src/app/api/user/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// BYPASS EMAILS
const BYPASS_EMAILS = (process.env.NEXT_PUBLIC_BYPASS_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function premiumByDate(subscriptionActiveUntil) {
  if (!subscriptionActiveUntil) return false;
  const until = new Date(subscriptionActiveUntil).getTime();
  return Number.isFinite(until) && until > Date.now();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = String(session?.user?.email || "").trim().toLowerCase();

  if (!email) return jsonResponse({ error: "Not authenticated" }, 401);

  const isBypassUser = Boolean(email && BYPASS_EMAILS.includes(email));

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { isPremium: true, subscriptionActiveUntil: true },
    });

    const isPremium = Boolean(user?.isPremium);
    const subscriptionActiveUntil = user?.subscriptionActiveUntil ?? null;

    const hasAccess = Boolean(
      isBypassUser || isPremium || premiumByDate(subscriptionActiveUntil)
    );

    return jsonResponse(
      {
        hasAccess,
        isBypassUser,
        isPremium,
        subscriptionActiveUntil,
      },
      200
    );
  } catch {
    return jsonResponse({ error: "Database error" }, 500);
  }
}
