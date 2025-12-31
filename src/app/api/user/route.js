// src/app/api/user/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  const emailRaw = session?.user?.email;
  const email = (emailRaw || "").trim().toLowerCase();

  if (!email) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { freeAttemptsUsed: true, isPremium: true, subscriptionActiveUntil: true },
    });

    return new Response(
      JSON.stringify({
        freeAttemptsUsed: user?.freeAttemptsUsed ?? 0,
        isPremium: user?.isPremium ?? false,
        subscriptionActiveUntil: user?.subscriptionActiveUntil ?? null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
