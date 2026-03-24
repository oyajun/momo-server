import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// [id] のユーザーを取得
async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return new Response("Missing ID parameter", { status: 400 });
  }

  try {
    await prisma.user.findUnique({
      where: {
        id: id,
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
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new Response("Failed to fetch user", {
      status: 500,
    });
  }
}

export { GET };
