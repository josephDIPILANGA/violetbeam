import { createEmailVerificationToken } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getFirstZodError, registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsedPayload = registerSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return Response.json({ error: getFirstZodError(parsedPayload.error) }, { status: 400 });
  }

  const { name, username, email, password, wantsToPostArticles, merchantProfile } = parsedPayload.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return Response.json({ error: "Un compte existe deja avec cet email." }, { status: 409 });
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUsername) {
    return Response.json({ error: "Ce username est deja utilise." }, { status: 409 });
  }

  if (wantsToPostArticles && merchantProfile?.shopDomain) {
    const existingShop = await prisma.merchantProfile.findUnique({
      where: { shopDomain: merchantProfile.shopDomain },
      select: { id: true },
    });

    if (existingShop) {
      return Response.json({ error: "Cette boutique est deja liee a un compte VioletBeam." }, { status: 409 });
    }
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      name,
      passwordHash: await hashPassword(password),
      emailVerified: null,
      merchantProfile:
        wantsToPostArticles && merchantProfile
          ? {
              create: {
                shopName: merchantProfile.shopName,
                shopDomain: merchantProfile.shopDomain,
                shopDescription: merchantProfile.shopDescription || null,
                sector: merchantProfile.sector || null,
                country: merchantProfile.country || null,
                wantsMarketplace: true,
                approvedForPosting: true,
              },
            }
          : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
    },
  });

  try {
    const token = await createEmailVerificationToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = new URL("/verify-email", appUrl);
    verificationUrl.searchParams.set("token", token);

    await sendVerificationEmail({
      to: user.email,
      name: user.name || "there",
      verificationUrl: verificationUrl.toString(),
    });
  } catch (error) {
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    console.error("Failed to send verification email", error);
    return Response.json({ error: "Impossible d'envoyer l'email de verification." }, { status: 500 });
  }

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    },
    message: "Compte cree. Verifiez votre email pour activer votre compte.",
  });
}
