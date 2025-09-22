import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response("Missing ID parameter", { status: 400 });
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: {
        userId: id,
      },
    });
    console.log(activity);
    return new Response(JSON.stringify(activity), { status: 200 });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return new Response("Failed to fetch activity", { status: 500 });
  }
}

export { GET };
