// src/app/api/user/update/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST() {
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
    // ✅ Безпечніше, ніж update: якщо юзер ще не створений — створимо
    const updated = await prisma.user.upsert({
      where: { email },
      update: { freeAttemptsUsed: { increment: 1 } },
      create: {
        email,
        freeAttemptsUsed: 1,
      },
      select: { freeAttemptsUsed: true },
    });

    return new Response(
      JSON.stringify({ success: true, freeAttemptsUsed: updated.freeAttemptsUsed }),
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
