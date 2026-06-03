"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgePercent, Search, Star, Truck, Zap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const hiddenPathPrefixes = [
  "/admin",
  "/api",
  "/sign-in",
  "/sign-up",
  "/verify-email",
];

export default function GlobalSearchBar() {
  const pathname = usePathname();
  const [freeShipping, setFreeShipping] = useState(false);
  const [topRated, setTopRated] = useState(false);
  const [fastDelivery, setFastDelivery] = useState(false);
  const [onSale, setOnSale] = useState(false);

  const isCatalogSearchPage = pathname === "/catalog" || pathname.startsWith("/catalog/page/");
  const isHidden = isCatalogSearchPage || hiddenPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isHidden) {
    return <div className="h-16 shrink-0" aria-hidden="true" />;
  }

  const quickFilters = [
    {
      label: "Deals",
      active: onSale,
      icon: BadgePercent,
      onClick: () => setOnSale((current) => !current),
    },
    {
      label: "Free shipping",
      active: freeShipping,
      icon: Truck,
      onClick: () => setFreeShipping((current) => !current),
    },
    {
      label: "Top rated",
      active: topRated,
      icon: Star,
      onClick: () => setTopRated((current) => !current),
    },
    {
      label: "Fast",
      active: fastDelivery,
      icon: Zap,
      onClick: () => setFastDelivery((current) => !current),
    },
  ];

  return (
    <>
      <section className="fixed left-0 right-0 top-16 z-[105] border-b border-white/70 bg-white/70 shadow-[0_18px_50px_-32px_rgba(92,54,118,0.55)] backdrop-blur-2xl">
        <form action="/catalog" className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 lg:flex-row lg:items-center lg:px-8">
          {freeShipping ? <input type="hidden" name="freeShipping" value="1" /> : null}
          {onSale ? <input type="hidden" name="onSale" value="1" /> : null}
          {topRated ? <input type="hidden" name="minRating" value="4" /> : null}
          {topRated ? <input type="hidden" name="sort" value="top-rated" /> : null}
          {fastDelivery && !topRated ? <input type="hidden" name="sort" value="delivery-fast" /> : null}

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8d5f9e]" size={16} strokeWidth={2.5} />
            <Input
              name="q"
              placeholder="Search clothing, brands, styles..."
              className="h-10 rounded-full border-white/70 bg-white/60 pl-11 pr-4 text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-2xl focus:border-[#C9A0CD] focus:ring-2 focus:ring-[#C9A0CD]/20"
            />
          </div>

          <div className="catalog-filter-scrollbar flex min-w-0 gap-2 overflow-x-auto">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;

              return (
                <button
                  key={filter.label}
                  type="button"
                  onClick={filter.onClick}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-[9px] font-black uppercase tracking-[0.14em] transition-all",
                    filter.active
                      ? "border-[#8d5f9e]/30 bg-[#8d5f9e] text-white shadow-lg shadow-purple-900/10"
                      : "border-white/70 bg-white/60 text-stone-500 hover:bg-white/80 hover:text-[#8d5f9e]",
                  )}
                >
                  <Icon size={13} className={cn(filter.active && filter.label === "Top rated" ? "fill-current" : "")} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button type="submit" className="h-10 rounded-full bg-[#1C1C1C] px-4 text-[9px] font-black uppercase tracking-[0.16em] text-white hover:bg-[#8d5f9e]">
              Search
            </Button>
            <Button asChild className="h-10 rounded-full bg-white/60 px-4 text-[9px] font-black uppercase tracking-[0.16em] text-stone-500 ring-1 ring-white/70 hover:bg-white/80">
              <Link href="/catalog">Catalog</Link>
            </Button>
          </div>
        </form>
      </section>
      <div className="h-32 shrink-0" aria-hidden="true" />
    </>
  );
}
