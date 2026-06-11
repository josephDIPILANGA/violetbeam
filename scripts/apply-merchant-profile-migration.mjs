import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

await prisma.$executeRawUnsafe(`
  ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "username" TEXT
`);

await prisma.$executeRawUnsafe(`
  CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key"
  ON "User" ("username")
`);

await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "MerchantProfile" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE,
    "shopName" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL UNIQUE,
    "shopDescription" TEXT,
    "sector" TEXT,
    "country" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'SHOPIFY',
    "wantsMarketplace" BOOLEAN NOT NULL DEFAULT true,
    "approvedForPosting" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )
`);

await prisma.$executeRawUnsafe(`
  CREATE INDEX IF NOT EXISTS "MerchantProfile_shopDomain_idx"
  ON "MerchantProfile" ("shopDomain")
`);

await prisma.$executeRawUnsafe(`
  CREATE INDEX IF NOT EXISTS "MerchantProfile_approvedForPosting_idx"
  ON "MerchantProfile" ("approvedForPosting")
`);

console.log("Merchant profile migration applied.");

await prisma.$disconnect();
