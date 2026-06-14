"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bot, Images, Layers, LogIn, LogOut, Menu, Settings, Shirt, Sparkles, Store, UserRound, WandSparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/cabine",
    label: "Cabine",
    icon: WandSparkles,
  },
  {
    href: "/catalog",
    label: "Catalog",
    icon: Shirt,
  },
  {
    href: "/categories",
    label: "Categories",
    icon: Layers,
  },
  {
    href: "/brands",
    label: "Brands",
    icon: Store,
  },
  {
    href: "/lookbook",
    label: "Lookbook",
    icon: Images,
  },
  {
    href: "/influencers",
    label: "Agents",
    icon: Bot,
  },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user;
  const userName = user?.name || user?.email?.split("@")[0] || "there";

  return (
    <header className="fixed left-0 right-0 top-0 z-[110]">
      <nav className="flex h-16 w-full items-center justify-between gap-4 border-b border-white/70 bg-white/70 px-4 shadow-[0_18px_50px_-32px_rgba(92,54,118,0.55)] backdrop-blur-2xl lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/55">
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
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                  isActive
                    ? "bg-[#8d5f9e] text-white shadow-sm"
                    : "text-stone-500 hover:bg-white/65 hover:text-[#8d5f9e]"
                )}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {status === "authenticated" && user ? (
            <>
            <Link href="/account" className="hidden items-center gap-3 rounded-lg bg-white/60 px-3 py-1.5 ring-1 ring-white/70 transition-colors hover:bg-white sm:flex">
              <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-[#f7f1fb] text-[#8d5f9e]">
                {user.image ? <img src={user.image} alt={userName} className="h-full w-full object-cover" /> : <UserRound size={15} />}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                Hello {userName}
              </span>
            </Link>
            <Link
              href="/merchant"
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 transition-colors hover:bg-white/65 hover:text-[#8d5f9e] lg:inline-flex"
            >
              <Store size={13} />
              Merchant
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 transition-colors hover:bg-white/65 hover:text-[#8d5f9e] sm:inline-flex"
            >
              <LogOut size={13} />
              <span className="hidden lg:inline">Sign out</span>
            </button>
            </>
          ) : (
            <>
            <Link
              href="/sign-in"
              className="hidden h-10 items-center gap-2 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 transition-colors hover:bg-white/65 hover:text-[#8d5f9e] sm:inline-flex"
            >
              <LogIn size={13} />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
            <Link
              href="/sign-up"
              className="hidden h-10 items-center rounded-lg bg-[#1C1C1C] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#8d5f9e] lg:inline-flex"
            >
              Sign up
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
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
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
                {link.label}
              </Link>
            );
          })}

          <div className="mt-2 border-t border-stone-200/70 pt-3">
            {status === "authenticated" && user ? (
              <div className="grid gap-2">
              <Link
                href="/account"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex h-12 w-full items-center gap-3 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
              >
                <Settings size={15} />
                Account
              </Link>
              <Link
                href="/merchant"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex h-12 w-full items-center gap-3 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
              >
                <Store size={15} />
                Merchant
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="inline-flex h-12 w-full items-center gap-3 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
              >
                <LogOut size={15} />
                Sign out
              </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/sign-in"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/50 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
                >
                  <LogIn size={14} />
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1C1C1C] px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#8d5f9e]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
