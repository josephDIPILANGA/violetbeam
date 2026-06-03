import Link from "next/link";
import { CheckCircle2, Clock, MailWarning, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

const contentByStatus = {
  verified: {
    icon: CheckCircle2,
    title: "Email verified",
    message: "Your VioletBeam account is active. You can now sign in and save your looks.",
    action: "Sign in",
    href: "/sign-in",
  },
  "already-verified": {
    icon: CheckCircle2,
    title: "Already verified",
    message: "This email address has already been verified. You can sign in normally.",
    action: "Sign in",
    href: "/sign-in",
  },
  expired: {
    icon: Clock,
    title: "Link expired",
    message: "This verification link is no longer valid. Create a new account request to receive a fresh link.",
    action: "Back to sign up",
    href: "/sign-up",
  },
  invalid: {
    icon: MailWarning,
    title: "Invalid link",
    message: "This verification link is invalid or has already been used.",
    action: "Back to sign up",
    href: "/sign-up",
  },
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const tokenParam = (await searchParams).token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const result = token ? await verifyEmailToken(token) : { status: "invalid" as const };
  const content = contentByStatus[result.status];
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-6 py-16 lg:px-10">
        <div className="w-full rounded-[40px] border border-white/80 bg-gradient-to-br from-[#fbf7ff]/90 via-white/85 to-white/95 p-8 text-center shadow-2xl shadow-purple-900/5 backdrop-blur-2xl md:p-12">
          <div className="mx-auto mb-8 flex size-16 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
            <Icon size={28} />
          </div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
            <Sparkles size={13} />
            VioletBeam account
          </div>
          <h1 className="font-serif text-6xl italic leading-[0.9] tracking-tight text-[#1C1C1C] md:text-8xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-stone-500">{content.message}</p>

          <Button asChild className="mt-8 h-12 rounded-full bg-[#1C1C1C] px-8 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
            <Link href={content.href}>{content.action}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
