import { headers } from "next/headers";
import * as z from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const baseSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});

const PublishedBook = baseSchema.extend({
  type: z.literal("PUBLISHED_BOOK"),
  isbn: z.string().length(13),
});

const OriginalBook = baseSchema.extend({
  type: z.literal("ORIGINAL_BOOK"),
  title: z.string().min(1).max(50),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch((_error) => {
    return new Response("Invalid JSON", { status: 400 });
  });

  const parsedBody = z
    .discriminatedUnion("type", [PublishedBook, OriginalBook])
    .safeParse(body);
  if (!parsedBody.success) {
    console.error("Zod validation error:", parsedBody.error);
    return new Response("Invalid request body", { status: 400 });
  }

  try {
    const maxOrder = await prisma.myBook.aggregate({
      _max: { order: true },
      where: { userId: session.user.id },
    });

    if (maxOrder._max.order === null) {
      maxOrder._max.order = 0;
    }

    await prisma.myBook.create({
      data: {
        ...parsedBody.data,
        order: maxOrder._max.order + 1,
        userId: session.user.id,
      },
    });

    return new Response(null, {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating record:", error);
    return new Response("Error creating record", { status: 500 });
  }
}
