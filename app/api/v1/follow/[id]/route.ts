import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function POST(
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
  } else if (id === session.user.id) {
    return new Response("Cannot follow yourself", { status: 400 });
  }

  try {
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        targetId: id,
      },
    });

    return new Response(null, { status: 201 });
  } catch (error) {
    console.error("Error creating follow relationship:", error);
    return new Response("Failed to create follow relationship", {
      status: 500,
    });
  }
}

async function DELETE(
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
    await prisma.follow.delete({
      where: {
        followerId_targetId: {
          followerId: session.user.id,
          targetId: id,
        },
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting follow relationship:", error);
    return new Response("Failed to delete follow relationship", {
      status: 500,
    });
  }
}

export { DELETE, POST };
