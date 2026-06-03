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

  const { name, email, password } = parsedPayload.data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return Response.json({ error: "Un compte existe deja avec cet email." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      emailVerified: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
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
    },
    message: "Compte cree. Verifiez votre email pour activer votre compte.",
  });
}
