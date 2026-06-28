"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bot, Building2, Images, Layers, LogIn, LogOut, Menu, Settings, Shirt, Sparkles, Star, Store, UserRound, WandSparkles, X } from "lucide-react";

import { addLocaleToPathname, getDictionary, getLocaleFromPathname, LOCALES, stripLocaleFromPathname } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/cabine",
    labelKey: "cabine",
    icon: WandSparkles,
  },
  {
    href: "/catalog",
    labelKey: "catalog",
    icon: Shirt,
  },
  {
    href: "/categories",
    labelKey: "categories",
    icon: Layers,
  },
  {
    href: "/brands",
    labelKey: "brands",
    icon: Star,
  },
  {
    href: "/shops",
    labelKey: "shops",
    icon: Building2,
  },
  {
    href: "/lookbook",
    labelKey: "lookbook",
    icon: Images,
  },
  {
    href: "/influencers",
    labelKey: "agents",
    icon: Bot,
  },
] as const;

export default function SiteNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const locale = getLocaleFromPathname(pathname);
  const dictionary = getDictionary(locale);
  const nav = dictionary.nav;
  const currentPathname = stripLocaleFromPathname(pathname);
  const user = session?.user;
  const userName = user?.name || user?.email?.split("@")[0] || "there";
  const localizeHref = (href: string) => addLocaleToPathname(href, locale);
  const languageHref = (nextLocale: typeof LOCALES[number]) => {
    const nextPathname = addLocaleToPathname(currentPathname, nextLocale);
    const query = searchParams.toString();
    return query ? `${nextPathname}?${query}` : nextPathname;
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-[110]">
      <nav className="flex h-16 w-full items-center justify-between gap-4 border-b border-white/70 bg-white/70 px-4 shadow-[0_18px_50px_-32px_rgba(92,54,118,0.55)] backdrop-blur-2xl lg:px-8">
        <Link href={localizeHref("/")} className="group flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/55">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1C1C1C] text-white shadow-sm transition-colors group-hover:bg-[#8d5f9e]">
            <Sparkles size={16} />
          </span>
          <span className="hidden font-serif text-2xl italic leading-none text-[#1C1C1C] sm:block">
            VioletBeam
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPathname === link.href || currentPathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={localizeHref(link.href)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                  isActive
                    ? "bg-[#8d5f9e] text-white shadow-sm"
                    : "text-stone-500 hover:bg-white/65 hover:text-[#8d5f9e]"
                )}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{nav[link.labelKey]}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden items-center rounded-lg bg-white/60 p-1 ring-1 ring-white/70 sm:flex">
            {LOCALES.map((entry) => (
              <Link
                key={entry}
                href={languageHref(entry)}
                aria-current={locale === entry ? "true" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-colors",
                  locale === entry
                    ? "bg-[#8d5f9e] text-white"
                    : "text-stone-500 hover:bg-white/80 hover:text-[#8d5f9e]",
                )}
              >
                {getDictionary(entry).language.short}
              </Link>
            ))}
          </div>

          {status === "authenticated" && user ? (
            <>
            <Link href={localizeHref("/account")} className="hidden items-center gap-3 rounded-lg bg-white/60 px-3 py-1.5 ring-1 ring-white/70 transition-colors hover:bg-white sm:flex">
              <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-[#f7f1fb] text-[#8d5f9e]">
                {user.image ? <img src={user.image} alt={userName} className="h-full w-full object-cover" /> : <UserRound size={15} />}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                {nav.hello} {userName}
              </span>
            </Link>
            <Link
              href={localizeHref("/merchant")}
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 transition-colors hover:bg-white/65 hover:text-[#8d5f9e] lg:inline-flex"
            >
              <Store size={13} />
              {nav.merchant}
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: addLocaleToPathname("/", locale) })}
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 transition-colors hover:bg-white/65 hover:text-[#8d5f9e] sm:inline-flex"
            >
              <LogOut size={13} />
              <span className="hidden lg:inline">{nav.signOut}</span>
            </button>
            </>
          ) : (
            <>
            <Link
              href={localizeHref("/sign-in")}
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 transition-colors hover:bg-white/65 hover:text-[#8d5f9e] sm:inline-flex"
            >
              <LogIn size={13} />
              <span className="hidden sm:inline">{nav.signIn}</span>
            </Link>
            <Link
              href={localizeHref("/sign-up")}
              className="hidden h-10 items-center rounded-lg bg-[#1C1C1C] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#8d5f9e] lg:inline-flex"
            >
              {nav.signUp}
            </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            className="inline-flex size-10 items-center justify-center rounded-lg bg-white/65 text-stone-600 ring-1 ring-white/75 transition-colors hover:text-[#8d5f9e] md:hidden"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "md:hidden overflow-hidden border-b border-white/70 bg-white/80 shadow-[0_24px_60px_-38px_rgba(92,54,118,0.65)] backdrop-blur-2xl transition-all duration-300",
          isMenuOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="grid gap-2 px-4 py-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPathname === link.href || currentPathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={localizeHref(link.href)}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-12 items-center gap-3 rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.18em] transition-all",
                  isActive
                    ? "bg-[#8d5f9e] text-white shadow-sm"
                    : "bg-white/50 text-stone-500 ring-1 ring-white/70 hover:text-[#8d5f9e]"
                )}
              >
                <Icon size={15} />
                {nav[link.labelKey]}
              </Link>
            );
          })}

          <div className="mt-2 border-t border-stone-200/70 pt-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              {LOCALES.map((entry) => (
                <Link
                  key={entry}
                  href={languageHref(entry)}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={locale === entry ? "true" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-[0.16em] ring-1 transition-colors",
                    locale === entry
                      ? "bg-[#8d5f9e] text-white ring-[#8d5f9e]"
                      : "bg-white/50 text-stone-500 ring-white/70 hover:text-[#8d5f9e]",
                  )}
                >
                  {getDictionary(entry).language.label}
                </Link>
              ))}
            </div>
            {status === "authenticated" && user ? (
              <div className="grid gap-2">
              <Link
                href={localizeHref("/account")}
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex h-12 w-full items-center gap-3 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
              >
                <Settings size={15} />
                {nav.account}
              </Link>
              <Link
                href={localizeHref("/merchant")}
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex h-12 w-full items-center gap-3 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
              >
                <Store size={15} />
                {nav.merchant}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut({ callbackUrl: addLocaleToPathname("/", locale) });
                }}
                className="inline-flex h-12 w-full items-center gap-3 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
              >
                <LogOut size={15} />
                {nav.signOut}
              </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={localizeHref("/sign-in")}
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
                >
                  <LogIn size={14} />
                  {nav.signIn}
                </Link>
                <Link
                  href={localizeHref("/sign-up")}
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1C1C1C] px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#8d5f9e]"
                >
                  {nav.signUp}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
