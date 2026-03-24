import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// フォローされているユーザー(followers)を取得
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
        where: {
          id: session.user.id,
        },
      })
      .followedBy();

    if (!followers || followers.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const followersUser = await prisma.user.findMany({
      where: {
        id: { in: followers.map((f) => f.followerId) },
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

    console.log(followersUser);
    return new Response(JSON.stringify(followersUser), { status: 200 });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return new Response("Failed to fetch followers", { status: 500 });
  }
}
