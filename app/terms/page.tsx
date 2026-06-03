import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CreditCard, FileText, Mail, Scale, ShieldAlert, Sparkles, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the VioletBeam terms of service covering virtual try-on, AI-generated images, subscriptions, credits, catalog links, and acceptable use.",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    title: "Using VioletBeam",
    icon: WandSparkles,
    body: [
      "VioletBeam provides AI fashion try-on, catalog discovery, lookbook, virtual agents, and related creative tools.",
      "You must use the service lawfully and only submit images, prompts, and content that you have the right to use.",
      "You are responsible for keeping your account credentials secure and for activity that occurs through your account.",
    ],
  },
  {
    title: "Virtual try-on and AI outputs",
    icon: Sparkles,
    body: [
      "AI-generated images are creative previews and may not perfectly represent garment fit, fabric, color, sizing, or real-world appearance.",
      "Generated outputs should not be treated as professional fashion, medical, legal, or body measurement advice.",
      "We may refuse or remove prompts, uploads, or generated content that appears abusive, illegal, non-consensual, deceptive, or harmful.",
    ],
  },
  {
    title: "Subscriptions and credits",
    icon: CreditCard,
    body: [
      "Paid plans provide a monthly allowance of virtual try-on generation credits. A successful generation consumes credits according to the plan rules.",
      "If a generation fails due to a service error, the reserved credit may be refunded automatically.",
      "Payments are processed by Stripe. Subscription changes, renewals, failed payments, cancellations, and invoices are handled through Stripe and the VioletBeam billing page.",
      "Unless otherwise stated, monthly credits renew after successful payment and may not roll over indefinitely.",
    ],
  },
  {
    title: "Catalog and shopping links",
    icon: BadgeCheck,
    body: [
      "The catalog may include third-party products, brands, affiliate links, marketplace links, or imported product information.",
      "Prices, availability, shipping, discounts, reviews, and product details may change on third-party websites.",
      "Purchases are completed with the relevant merchant or platform. VioletBeam is not the seller of third-party products unless explicitly stated.",
    ],
  },
  {
    title: "Acceptable use",
    icon: ShieldAlert,
    body: [
      "Do not upload images of other people without consent.",
      "Do not use VioletBeam to create misleading impersonations, illegal content, harassment, adult sexual content involving non-consenting people, or content that violates platform rules.",
      "Do not attempt to bypass credit limits, abuse subscriptions, scrape the service, reverse engineer private systems, or interfere with the platform.",
    ],
  },
  {
    title: "Service availability",
    icon: FileText,
    body: [
      "VioletBeam may change, suspend, limit, or discontinue features as the product evolves.",
      "AI providers, payment providers, catalog partners, hosting platforms, and social platforms may affect availability or performance.",
      "We aim to provide a useful and reliable service, but we cannot guarantee uninterrupted or error-free operation.",
    ],
  },
  {
    title: "Liability",
    icon: Scale,
    body: [
      "VioletBeam is provided on an as-is and as-available basis to the maximum extent permitted by law.",
      "We are not responsible for third-party merchant decisions, product quality, shipping outcomes, social platform restrictions, or external payment provider issues.",
      "Nothing in these terms limits rights that cannot be limited under applicable law.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-10">
        <div className="mb-8">
          <Button asChild variant="outline" className="h-11 rounded-full border-stone-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 hover:text-[#8d5f9e]">
            <Link href="/">
              <ArrowLeft size={14} />
              Home
            </Link>
          </Button>
        </div>

        <header className="mb-12 overflow-hidden rounded-[40px] border border-white/75 bg-white/65 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl md:p-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.34em] text-[#8d5f9e]">
            <Scale size={13} />
            Terms
          </div>
          <h1 className="font-serif text-6xl italic leading-[0.9] tracking-tight text-[#1C1C1C] md:text-8xl">
            Terms of Service
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-stone-500">
            These terms explain the rules for using VioletBeam, including virtual try-on generation, subscriptions,
            credits, AI outputs, catalog links, and acceptable use.
          </p>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
            Last updated: June 2, 2026
          </p>
        </header>

        <section className="grid gap-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <article key={section.title} className="rounded-[30px] border border-white/75 bg-white/65 p-6 shadow-sm backdrop-blur-2xl md:p-8">
                <div className="mb-5 flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
                    <Icon size={20} />
                  </span>
                  <h2 className="font-serif text-4xl italic leading-none text-[#1C1C1C]">{section.title}</h2>
                </div>
                <ul className="space-y-3 text-sm leading-7 text-stone-500">
                  {section.body.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-[#8d5f9e]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-[30px] border border-white/75 bg-[#1C1C1C] p-6 text-white shadow-2xl shadow-purple-900/10 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#C9A0CD]">
                <Mail size={13} />
                Questions
              </div>
              <h2 className="font-serif text-4xl italic leading-none">Need clarification?</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                For questions about these terms, subscriptions, credits, or acceptable use, contact VioletBeam.
              </p>
            </div>
            <Button asChild className="h-12 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-[0.18em] text-[#1C1C1C] hover:bg-[#C9A0CD] hover:text-white">
              <a href="mailto:joseph.d@violetbeam.com">
                joseph.d@violetbeam.com
                <Mail size={14} />
              </a>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
