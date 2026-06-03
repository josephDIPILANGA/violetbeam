import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard, Database, Lock, Mail, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the VioletBeam privacy policy, including how account data, virtual try-on images, payments, analytics, and AI generation data are handled.",
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    title: "Information we collect",
    icon: Database,
    body: [
      "Account information such as your name, email address, authentication details, and profile settings.",
      "Virtual try-on inputs such as uploaded photos, selected products, generated prompts, and generated images when you use the cabine experience.",
      "Catalog and interaction data such as viewed products, selected filters, saved compositions, and links clicked.",
      "Billing information handled through Stripe, including subscription status, Stripe customer identifiers, invoices, and credit usage. VioletBeam does not store full card numbers.",
    ],
  },
  {
    title: "How we use data",
    icon: WandSparkles,
    body: [
      "To provide the virtual try-on, catalog, lookbook, AI agent, and account features.",
      "To generate images and previews using AI services based on the inputs you choose to submit.",
      "To manage subscriptions, generation credits, fraud prevention, and customer support.",
      "To improve product discovery, search relevance, site performance, and user experience.",
    ],
  },
  {
    title: "AI generation",
    icon: Sparkles,
    body: [
      "When you request an AI try-on or generated fashion image, the relevant prompt, selected product images, and uploaded reference image may be sent to AI service providers for processing.",
      "You should only upload images that you have the right to use. Do not upload sensitive, illegal, or non-consensual images.",
      "Generated results may be stored in your account history or saved compositions when you choose to keep them.",
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    body: [
      "Payments and subscriptions are processed by Stripe. Stripe may collect payment details, billing information, fraud signals, and transaction metadata under its own privacy terms.",
      "VioletBeam stores only the information needed to understand your subscription status, credit balance, and billing events.",
    ],
  },
  {
    title: "Security and retention",
    icon: Lock,
    body: [
      "We use reasonable technical and organizational measures to protect user data.",
      "Data is kept only as long as needed for the service, legal obligations, fraud prevention, accounting, or legitimate product operations.",
      "You can request deletion or correction of your personal data by contacting VioletBeam.",
    ],
  },
  {
    title: "Your choices",
    icon: ShieldCheck,
    body: [
      "You can choose not to upload personal images, but some virtual try-on features will not work without them.",
      "You can manage your subscription from the billing page when Stripe customer portal access is available.",
      "You can contact us to request access, correction, export, or deletion of personal data linked to your account.",
    ],
  },
];

export default function PrivacyPage() {
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
            <ShieldCheck size={13} />
            Privacy
          </div>
          <h1 className="font-serif text-6xl italic leading-[0.9] tracking-tight text-[#1C1C1C] md:text-8xl">
            Privacy Policy
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-stone-500">
            This policy explains how VioletBeam handles data when you use the virtual try-on cabine, catalog, lookbook,
            AI agents, billing, and related services.
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
                Contact
              </div>
              <h2 className="font-serif text-4xl italic leading-none">Privacy requests</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                For privacy questions, data access, correction, or deletion requests, contact VioletBeam.
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
