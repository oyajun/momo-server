import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const followers = await prisma.user
      .findUnique({
        where: { id: session.user.id },
      })
      .follows();

    if (!followers || followers.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const activity = await prisma.activity.findMany({
      where: {
        userId: { in: followers.map((f) => f.targetId) },
      },
    });
    console.log(activity);
    return new Response(JSON.stringify(activity), { status: 200 });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return new Response("Failed to fetch activity", { status: 500 });
  }
}
