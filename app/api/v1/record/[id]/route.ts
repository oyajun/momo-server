import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function POST(request: Request) {
  const session = await auth.api.getSession(
    {
      headers: await headers()
    }
  );
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = session.user;

}


async function PUT(request: Request) {
  const session = await auth.api.getSession(
    {
      headers: await headers()
    }
  );
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = session.user;

}

async function DELETE(request: Request) {
  const session = await auth.api.getSession(
    {
      headers: await headers()
    }
  );
  

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = session.user;

}