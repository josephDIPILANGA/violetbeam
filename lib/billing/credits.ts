import { prisma } from "@/lib/prisma";

export async function grantCredits(input: {
  userId: number;
  amount: number;
  reason: string;
  source?: string;
  stripeEventId?: string;
}) {
  if (input.amount <= 0) return null;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: {
        id: input.userId,
      },
      data: {
        creditsBalance: {
          increment: input.amount,
        },
      },
      select: {
        creditsBalance: true,
      },
    });

    return tx.creditLedger.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        balanceAfter: user.creditsBalance,
        reason: input.reason,
        source: input.source,
        stripeEventId: input.stripeEventId,
      },
    });
  });
}

export async function reserveCredits(input: {
  userId: number;
  amount: number;
  reason: string;
  route: string;
  imageModel?: string;
  promptHash?: string;
}) {
  if (input.amount <= 0) {
    throw new Error("Credit amount must be positive.");
  }

  return prisma.$transaction(async (tx) => {
    const generation = await tx.generationUsage.create({
      data: {
        userId: input.userId,
        route: input.route,
        status: "STARTED",
        creditsCharged: input.amount,
        imageModel: input.imageModel,
        promptHash: input.promptHash,
      },
    });

    const updated = await tx.user.updateMany({
      where: {
        id: input.userId,
        creditsBalance: {
          gte: input.amount,
        },
      },
      data: {
        creditsBalance: {
          decrement: input.amount,
        },
      },
    });

    if (updated.count !== 1) {
      await tx.generationUsage.update({
        where: {
          id: generation.id,
        },
        data: {
          status: "BLOCKED_NO_CREDITS",
          creditsCharged: 0,
        },
      });

      throw new Error("NO_CREDITS");
    }

    const user = await tx.user.findUniqueOrThrow({
      where: {
        id: input.userId,
      },
      select: {
        creditsBalance: true,
      },
    });

    await tx.creditLedger.create({
      data: {
        userId: input.userId,
        amount: -input.amount,
        balanceAfter: user.creditsBalance,
        reason: input.reason,
        source: input.route,
        generationId: generation.id,
      },
    });

    return generation;
  });
}

export async function markGenerationSucceeded(generationId: number) {
  return prisma.generationUsage.update({
    where: {
      id: generationId,
    },
    data: {
      status: "SUCCESS",
    },
  });
}

export async function refundReservedCredits(input: {
  generationId: number;
  userId: number;
  amount: number;
  errorMessage?: string;
}) {
  if (input.amount <= 0) return null;

  return prisma.$transaction(async (tx) => {
    const generation = await tx.generationUsage.update({
      where: {
        id: input.generationId,
      },
      data: {
        status: "FAILED_REFUNDED",
        errorMessage: input.errorMessage,
      },
    });

    const user = await tx.user.update({
      where: {
        id: input.userId,
      },
      data: {
        creditsBalance: {
          increment: input.amount,
        },
      },
      select: {
        creditsBalance: true,
      },
    });

    await tx.creditLedger.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        balanceAfter: user.creditsBalance,
        reason: "Generation failed refund",
        source: generation.route,
        generationId: generation.id,
      },
    });

    return generation;
  });
}
