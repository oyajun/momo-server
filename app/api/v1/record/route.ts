import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RecordType = "PUBLISHED_BOOK" | "ORIGINAL_BOOK" | "NO_BOOK";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const {
    type,
    amount,
    comment,
    dateUTC,
    timeDifference,
    isbn,
    originalBookId,
  } = body;

  if (!type || typeof amount !== "number" || !dateUTC || !timeDifference) {
    return new Response("Invalid request body", { status: 400 });
  }

  // 共通フィールド
  const baseData: {
    userId: string;
    type: RecordType;
    amount: number;
    comment?: string;
    dateUTC: Date;
    timeDifference: number;

    isbn?: string;
    originalBookId?: bigint;
  } = {
    userId: session.user.id,
    type,
    amount,
    comment,
    dateUTC: new Date(dateUTC),
    timeDifference,
  };

  if (type === "PUBLISHED_BOOK") {
    if (!isbn) {
      return new Response("Missing isbn for published book", { status: 400 });
    }
    baseData.isbn = isbn;
  } else if (type === "ORIGINAL_BOOK") {
    if (!originalBookId) {
      return new Response("Missing originalBookId for original book", {
        status: 400,
      });
    }
    try {
      baseData.originalBookId = BigInt(originalBookId);
    } catch (_error) {
      return new Response("originalBookId is not BigInt", {
        status: 400,
      });
    }
  } else if (type === "NO_BOOK") {
  } else {
    return new Response("Invalid type", { status: 400 });
  }

  try {
    await prisma.record.create({
      data: baseData,
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
