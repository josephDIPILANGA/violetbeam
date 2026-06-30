import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, BadgeCheck, CreditCard, FileText, Mail, Scale, ShieldAlert, Sparkles, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addLocaleToPathname, DEFAULT_LOCALE, getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

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

const sectionIcons = [WandSparkles, Sparkles, CreditCard, BadgeCheck, ShieldAlert, FileText, Scale];

async function getRequestLocale(): Promise<Locale> {
  const headersList = await headers();
  const requestedLocale = headersList.get("x-violetbeam-locale") || undefined;
  return isLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
}

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const legalCopy = dictionary.legal;

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-10">
        <div className="mb-8">
          <Button asChild variant="outline" className="h-11 rounded-full border-stone-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 hover:text-[#8d5f9e]">
            <Link href={addLocaleToPathname("/", locale)}>
              <ArrowLeft size={14} />
              {legalCopy.home}
            </Link>
          </Button>
        </div>

        <header className="mb-12 overflow-hidden rounded-[40px] border border-white/75 bg-white/65 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl md:p-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.34em] text-[#8d5f9e]">
            <Scale size={13} />
            {legalCopy.termsLabel}
          </div>
          <h1 className="font-serif text-6xl italic leading-[0.9] tracking-tight text-[#1C1C1C] md:text-8xl">
            {legalCopy.termsTitle}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-stone-500">
            {legalCopy.termsIntro}
          </p>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
            {legalCopy.lastUpdated}
          </p>
        </header>

        <section className="grid gap-5">
          {legalCopy.termsSections.map((section, index) => {
            const Icon = sectionIcons[index] || FileText;

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
                {legalCopy.questions}
              </div>
              <h2 className="font-serif text-4xl italic leading-none">{legalCopy.termsClarification}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                {legalCopy.termsContact}
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
