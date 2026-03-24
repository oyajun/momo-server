import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// フォローしているユーザー(followees)を取得
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const followees = await prisma.user
      .findUnique({
        where: {
          id: session.user.id,
        },
      })
      .follows();

    if (!followees || followees.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const followeesUser = await prisma.user.findMany({
      where: {
        id: { in: followees.map((f) => f.targetId) },
      },
      select: {
        id: true,
        name: true,
        image: true,
        activity: {
          select: {
            studyingNow: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        activity: {
          updatedAt: "desc",
        },
      },
    });

    console.log(followeesUser);
    return new Response(JSON.stringify(followeesUser), { status: 200 });
  } catch (error) {
    console.error("Error fetching followees:", error);
    return new Response("Failed to fetch followees", { status: 500 });
  }
}
