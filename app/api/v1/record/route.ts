import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  if (!body || typeof body.amount !== "number" || !body.date) {
    return new Response("Invalid request body", { status: 400 });
  }

  const record = await prisma.record
    .create({
      data: {
        userId: session.user.id,
        amount: body.amount,
        date: body.date,
      },
    })
    .catch((error) => {
      console.error("Error creating record:", error);
      return new Response("Error creating record", { status: 500 });
    });

  return new Response(JSON.stringify(record), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  if (!body || !body.id) {
    return new Response("Invalid request body", { status: 400 });
  }

  prisma.record
    .delete({
      where: {
        id: body.id,
        userId: session.user.id,
      },
    })
    .catch((error) => {
      console.error("Error creating record:", error);
      return new Response("Error deleting record", { status: 500 });
    });

  return new Response(null, { status: 204 });
}

export { POST, DELETE };
