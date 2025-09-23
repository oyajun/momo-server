import { prisma } from "@/lib/prisma";

export default async function insertActivity(userId: string) {
  const activity_low = await prisma.activity.findUnique({
    where: {
      userId,
    },
  });

  if (activity_low) {
    // User already has an activity record, no need to insert a new one
    return;
  }

  try {
    await prisma.activity.create({
      data: {
        userId,
      },
    });
  } catch (error) {
    console.error("Error inserting activity low:", error);
  }
}
