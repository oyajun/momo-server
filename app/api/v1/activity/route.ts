import type { NextRequest } from "next/server";
import * as z from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    console.log(activity);
    return new Response(JSON.stringify(activity), { status: 200 });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return new Response("Failed to fetch activity", { status: 500 });
  }
}

const activitySchema = z.object({
  nowStudying: z.boolean(),
});

async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch((_error) => {
    return new Response("Invalid JSON", { status: 400 });
  });
  const parsedBody = activitySchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response("Invalid request body", { status: 400 });
  } else {
  }

  try {
    await prisma.activity.update({
      where: {
        userId: session.user.id,
      },
      data: {
        studyingNow: parsedBody.data.nowStudying,
      },
    });

    return new Response(null, { status: 201 });
  } catch (error) {
    console.error("Error updating activity:", error);
    return new Response("Failed to update activity", {
      status: 500,
    });
  }
}

export { GET, POST };
