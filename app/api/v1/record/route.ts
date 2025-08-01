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

const getSchema = z.object({
  cursor: z.optional(
    z.string().transform((val) => {
      return BigInt(val);
    }),
  ),
  limit: z.optional(z.number().int().min(1).max(100)).default(10),
});

async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch((_error) => {
    return new Response("Invalid JSON", { status: 400 });
  });
  const parsedBody = getSchema.safeParse(body);

  if (!parsedBody.success) {
    console.error("Zod validation error:", parsedBody.error);
    return new Response("Invalid request body", { status: 400 });
  }

  try {
    // フォローしているユーザーと自分の投稿を取得
    // id を string に変換
    const { cursor, limit } = parsedBody.data;
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
      orderBy: { id: "asc" },
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
