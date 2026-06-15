"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setRole(role: "intern") {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role },
  });

  revalidatePath("/");
  return { success: true };
}

export async function verifyMentorCode(code: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const expectedCode = process.env.MENTOR_SECRET_CODE || "mentor123";

  if (code === expectedCode) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "mentor" },
    });
    revalidatePath("/");
    return { success: true };
  } else {
    return { error: "Invalid secret code" };
  }
}

export async function getLogs() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const isMentor = session.user.role === "mentor";

  if (isMentor) {
    return prisma.dailyLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  } else {
    return prisma.dailyLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }
}

export async function createLog(data: { done: string; learned: string; nextSteps: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.dailyLog.create({
    data: {
      ...data,
      date: new Date(),
      status: "pending",
      userId: session.user.id,
    },
  });

  revalidatePath("/");
}

export async function updateLogStatus(id: string, status: string, supervisorComment?: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "mentor") throw new Error("Unauthorized");

  await prisma.dailyLog.update({
    where: { id },
    data: { status, supervisorComment },
  });

  revalidatePath("/");
}

export async function deleteLog(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const log = await prisma.dailyLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) throw new Error("Unauthorized or not found");

  await prisma.dailyLog.delete({ where: { id } });

  revalidatePath("/");
}
