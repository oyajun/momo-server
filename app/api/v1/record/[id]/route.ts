import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!params.id) {
    return new Response("Missing ID parameter", { status: 400 });
  }

  let recordId: bigint;
  try {
    recordId = BigInt(params.id);
  } catch (_error) {
    return new Response("Invalid ID format", { status: 400 });
  }

  try {
    await prisma.record.delete({
      where: {
        id: recordId,
        userId: session.user.id,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting record:", error);
    return new Response("Failed to delete record", { status: 500 });
  }
}
