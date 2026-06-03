import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);

  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
    },
  });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashEmailVerificationToken(token);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          emailVerified: true,
        },
      },
    },
  });

  if (!verificationToken) {
    return { status: "invalid" as const };
  }

  if (verificationToken.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerificationToken.delete({
      where: {
        id: verificationToken.id,
      },
    });

    return { status: "expired" as const };
  }

  if (verificationToken.user.emailVerified) {
    await prisma.emailVerificationToken.delete({
      where: {
        id: verificationToken.id,
      },
    });

    return { status: "already-verified" as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        emailVerified: new Date(),
      },
    }),
    prisma.emailVerificationToken.delete({
      where: {
        id: verificationToken.id,
      },
    }),
  ]);

  return { status: "verified" as const };
}
