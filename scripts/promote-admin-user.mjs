import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function getArg(name, fallback = undefined) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

async function main() {
  const email = getArg("email", process.env.ADMIN_EMAILS?.split(",")[0] || process.env.DEFAULT_USER_EMAIL);

  if (!email) {
    throw new Error("Provide an email with --email user@example.com or set ADMIN_EMAILS.");
  }

  const user = await prisma.user.update({
    where: {
      email,
    },
    data: {
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(`Promoted ${user.email} to ${user.role}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
