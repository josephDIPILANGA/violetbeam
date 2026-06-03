import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const isAdminRole = session?.user?.role === "ADMIN";
  const isAdminEmail = email ? parseAdminEmails().includes(email) : false;

  return isAdminRole || isAdminEmail ? session : null;
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireAdminApi() {
  const session = await getAdminSession();

  if (!session) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  return null;
}
