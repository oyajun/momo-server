import { headers } from "next/headers";
import superjson from "superjson";
import * as z from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const baseSchema = z.object({
  amount: z
    .number()
    .int()
    .min(1) //1min.
    .max(60 * 24), //24h
  comment: z.optional(z.string()),
  dateUTC: z.iso.datetime(),
  dateLocal: z.iso.datetime(),
});

const PublishedBook = baseSchema.extend({
  type: z.literal("PUBLISHED_BOOK"),
  isbn: z.string().length(13),
});

const OriginalBook = baseSchema.extend({
  type: z.literal("ORIGINAL_BOOK"),
  originalBookId: z.string().transform((val) => {
    return BigInt(val);
  }),
});

const NoBook = baseSchema.extend({
  type: z.literal("NO_BOOK"),
});

async function POST(request: Request) {
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
    .discriminatedUnion("type", [PublishedBook, OriginalBook, NoBook])
    .safeParse(body);
  if (!parsedBody.success) {
    console.error("Zod validation error:", parsedBody.error);
    return new Response("Invalid request body", { status: 400 });
  }

  try {
    await prisma.record.create({
      data: {
        ...parsedBody.data,
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

async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const cursorStr = url.searchParams.get("cursor");
  const limitStr = url.searchParams.get("limit");

  try {
    // BigInt can throw an error
    const cursor = cursorStr ? BigInt(cursorStr) : undefined;
    // parseInt cannot throw an error
    const limit = limitStr ? parseInt(limitStr) : 10;
    console.log(limit);
    if (limit < 1 || limit > 20 || Number.isNaN(limit)) {
      return new Response("Invalid limit", { status: 400 });
    }

    const records = await prisma.record.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            userId: {
              in: (
                await prisma.follow.findMany({
                  where: { followerId: session.user.id },
                })
              ).map((follow) => follow.targetId),
            },
          },
        ],
      },
      include: {
        originalBook: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const { json } = superjson.serialize(records);

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    return new Response("Error fetching records", { status: 500 });
  }
}

export { POST, GET };
