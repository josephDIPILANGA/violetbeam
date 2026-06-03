"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  Shirt,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Filter,
  Store,
  Tag,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type LookbookComposition } from "@/lib/compositions";
import { cn } from "@/lib/utils";

type LookbookClientProps = {
  compositions: LookbookComposition[];
};

const GALLERY_PAGE_SIZE = 9;

function getSearchText(composition: LookbookComposition) {
  return [
    composition.name,
    composition.userName,
    ...composition.items.flatMap((item) => [item.name, item.brand, item.moduleLabel, item.prompt]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function CompositionCard({
  composition,
  featured = false,
  onOpen,
}: {
  composition: LookbookComposition;
  featured?: boolean;
  onOpen: (composition: LookbookComposition) => void;
}) {
  const imageUrl = composition.thumbnailUrl || composition.generatedUrl;
  const cardHref = composition.href;
  const openComposition = () => {
    if (!cardHref) onOpen(composition);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openComposition}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openComposition();
        }
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden transition-all duration-700 focus:outline-none focus:ring-4 focus:ring-[#C9A0CD]/25",
        featured
          ? "grid min-h-[500px] rounded-[40px] border border-white/80 bg-white/40 md:grid-cols-[1.2fr_0.8fr] shadow-2xl shadow-purple-900/5 backdrop-blur-2xl"
          : "flex flex-col rounded-[32px] border border-white/60 bg-white/60 hover:bg-white/90 hover:shadow-2xl hover:shadow-purple-900/10 hover:-translate-y-2"
      )}
    >
      {/* Conteneur d'image */}
      <div
        className={cn(
          "relative overflow-hidden",
          featured ? "min-h-[340px] md:min-h-full" : "aspect-[4/5] rounded-t-[32px]"
        )}
      >
        <img
          src={imageUrl}
          alt={composition.name}
          className="h-full w-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-110"
          onError={(event) => {
            event.currentTarget.src =
              "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000";
          }}
        />

        {/* Badge flottant */}
        <div className="absolute left-6 top-6 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
            <Sparkles size={12} className="text-purple-300" />
          {composition.items.length} PIÈCES
          </div>
          {composition.sourceType === "agentPost" && (
            <div className="rounded-full border border-white/20 bg-[#8d5f9e]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
              Agent
            </div>
          )}
        </div>

        {/* Overlay au survol */}
        {!featured && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#4f365f]/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-end p-8">
            {cardHref ? (
              <Link
                href={cardHref}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex h-8 w-full items-center justify-center rounded-full bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-all"
              >
                Voir le look
              </Link>
            ) : (
              <span className="inline-flex h-8 w-full items-center justify-center rounded-full bg-white/90 px-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition-all">
                Voir le look
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contenu textuel */}
      <div
        className={cn(
          "flex flex-col p-8 md:p-10",
          featured ? "justify-center" : "flex-1"
        )}
      >
        
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8d5f9e]">
            <CalendarDays size={14} strokeWidth={2.5} />
            <span>{new Date(composition.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>

          <h2
            className={cn(
              "italic leading-[1.05] text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]",
              featured ? "line-clamp-2 text-4xl font-serif md:text-5xl lg:text-6xl" : "truncate text-3xl font-serif"
            )}
          >
            {composition.name}
          </h2>

          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-stone-400">
            {composition.sourceLabel || composition.userName || "CABINE STUDIO"}
          </p>
        </header>

        <div className={cn("mt-auto pt-8", featured ? "block" : "hidden group-hover:block transition-all duration-500")}>
          <div className="mb-6 h-[1px] w-full bg-gradient-to-r from-[#C9A0CD]/40 via-stone-200 to-transparent" />

          <div className="flex flex-wrap gap-3">
            {composition.items.slice(0, featured ? 8 : 4).map((item, index) => (
              <div
                key={`${composition.id}-${item.moduleId}-${item.id}-${index}`}
                className="group/item flex items-center gap-3 rounded-full bg-white/50 p-1.5 pr-4 ring-1 ring-stone-200 transition-all hover:ring-[#C9A0CD] hover:bg-white shadow-sm"
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="size-9 rounded-full object-cover ring-2 ring-white" />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#f7f1fb] text-[#8d5f9e]">
                    <Shirt size={14} />
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="max-w-[100px] truncate text-[10px] font-bold text-[#1C1C1C]">{item.name}</span>
                  <span className="text-[8px] font-medium uppercase tracking-tighter text-stone-400">
                    {item.brand || item.moduleLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {cardHref && (
            <Link
              href={cardHref}
              onClick={(event) => event.stopPropagation()}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[#1C1C1C] px-5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#8d5f9e]"
            >
              Detail page
              <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function formatPrice(price: number | string | undefined, currency = "EUR") {
  if (typeof price === "number") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(price);
  }

  return price || "Prix à venir";
}

function CompositionModal({
  composition,
  onClose,
}: {
  composition: LookbookComposition;
  onClose: () => void;
}) {
  const imageUrl = composition.thumbnailUrl || composition.generatedUrl;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1C1C1C]/45 p-4 backdrop-blur-2xl animate-in fade-in duration-300">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fermer le détail" />

      <section className="relative grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/80 bg-[#FDFBFF]/95 shadow-2xl shadow-purple-950/20 md:grid-cols-[0.95fr_1.05fr]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex size-11 items-center justify-center rounded-full bg-white/85 text-[#1C1C1C] shadow-lg backdrop-blur-xl transition-colors hover:bg-white"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[360px] overflow-hidden bg-[#eee7f4] md:min-h-[620px]">
          <img src={imageUrl} alt={composition.name} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#1C1C1C]/55 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white backdrop-blur-xl ring-1 ring-white/25">
              <Sparkles size={13} className="text-purple-200" />
              {composition.sourceType === "agentPost" ? "VioletBeam Agent" : "Composition"}
            </div>
            <h2 className="line-clamp-2 font-serif text-4xl italic leading-[0.95] text-white md:text-5xl lg:text-6xl">{composition.name}</h2>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
              {composition.sourceLabel || composition.userName || "CABINE STUDIO"}
            </p>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-6 md:p-10">
          <header className="mb-8 pr-12">
            <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8d5f9e]">
              <CalendarDays size={14} strokeWidth={2.5} />
              <span>{new Date(composition.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
            <h3 className="font-serif text-4xl italic leading-none text-[#1C1C1C]">Articles du look</h3>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              Les prix et liens boutique apparaîtront automatiquement quand les articles seront enrichis dans le catalogue.
            </p>
          </header>

          <div className="space-y-4">
            {composition.items.length > 0 ? (
              composition.items.map((item, index) => (
                <article
                  key={`${composition.id}-modal-${item.moduleId}-${item.id}-${index}`}
                  className="group/item grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-[28px] border border-white/80 bg-white/70 p-3 shadow-sm transition-all hover:bg-white hover:shadow-xl hover:shadow-purple-900/5"
                >
                  <div className="aspect-square overflow-hidden rounded-[22px] bg-[#f7f1fb]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]">
                        <Shirt size={26} strokeWidth={1.4} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 py-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#8d5f9e]/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-[#8d5f9e]">
                        {item.moduleLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-stone-500">
                        <Tag size={10} />
                        {formatPrice(item.price, item.currency)}
                      </span>
                    </div>

                    <h4 className="truncate font-serif text-2xl italic leading-none text-[#1C1C1C]">{item.name}</h4>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
                      {item.brand || "Maison partenaire"}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-stone-500">
                      {item.description || item.prompt || "Description à venir."}
                    </p>

                    {item.shopUrl ? (
                      <a
                        href={item.shopUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1C1C1C] px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8d5f9e]"
                      >
                        Boutique
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                        <Store size={12} />
                        Lien à venir
                      </span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-stone-200 bg-white/60 text-center">
                <Shirt className="mb-4 text-stone-300" size={32} />
                <p className="font-serif text-3xl italic text-stone-800">Aucun article lié</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LookbookClient({ compositions = [] }: LookbookClientProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeComposition, setActiveComposition] = useState<LookbookComposition | null>(null);

  const heroCompositions = compositions.slice(0, 5);
  const featuredComposition = heroCompositions[0];
  const secondaryCompositions = heroCompositions.slice(1);

  const filteredCompositions = useMemo(() => {
    const value = search.trim().toLowerCase();
    const baseList = compositions.slice(5);

    if (!value) return baseList;

    return compositions.filter((composition) => getSearchText(composition).includes(value));
  }, [compositions, search]);
  const pageCount = Math.max(1, Math.ceil(filteredCompositions.length / GALLERY_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paginatedCompositions = filteredCompositions.slice(
    (safePage - 1) * GALLERY_PAGE_SIZE,
    safePage * GALLERY_PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C] font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Inter:wght@400;700;900&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Ornements en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#E6E8FA]/40 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-[#C9A0CD]/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Section En-tête */}
        <header className="mb-20 space-y-12">
          <div className="flex flex-col justify-between items-start md:items-end gap-8 md:flex-row">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8d5f9e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8d5f9e]"></span>
                </span>
                LIVE LOOKBOOK
              </div>
              <h1 className="font-serif text-7xl md:text-9xl italic leading-[0.85] tracking-tight text-[#1C1C1C]">
                L&apos;Atelier <br /> <span className="text-[#8d5f9e]">Créatif</span>
              </h1>
            </div>

            <Button asChild className="group h-16 rounded-full bg-[#1C1C1C] pl-8 pr-4 text-[11px] font-black uppercase tracking-[0.25em] text-white hover:bg-[#2a2a2a] transition-all flex items-center gap-4">
              <Link href="/cabine">
                Créer un look
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 group-hover:bg-[#8d5f9e] transition-colors">
                  <ArrowUpRight size={18} />
                </div>
              </Link>
            </Button>
          </div>

          {/* Grille Featured */}
          {featuredComposition ? (
            <div className="grid items-stretch gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <CompositionCard composition={featuredComposition} featured onOpen={setActiveComposition} />
              </div>
              <div className="flex h-full flex-col gap-6 lg:col-span-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Tendances Récentes</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="text-[10px] font-bold uppercase tracking-tighter text-[#8d5f9e] hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                {secondaryCompositions.map((composition) => (
                  <button
                    key={composition.id}
                    onClick={() => setActiveComposition(composition)}
                    className="group flex min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/80 bg-white/50 text-left transition-all hover:bg-white hover:shadow-xl hover:shadow-purple-900/5"
                  >
                    <div className="h-full w-28 shrink-0 overflow-hidden">
                      <img
                        src={composition.thumbnailUrl || composition.generatedUrl}
                        alt={composition.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=200";
                        }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-6">
                      <h4 className="font-serif text-xl italic text-[#1C1C1C] line-clamp-1">{composition.name}</h4>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[#8d5f9e]/60">
                        {composition.items.length} Articles
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl mb-6">
                <Sparkles className="text-[#8d5f9e]/50" size={32} />
              </div>
              <h3 className="font-serif text-4xl italic text-stone-800">Aucune composition</h3>
              <p className="mt-2 max-w-md text-stone-400 font-medium">
                Les looks validés depuis la cabine apparaîtront ici.
              </p>
            </div>
          )}
        </header>

        {/* Section Galerie */}
        <section className="space-y-12">
          <div className="flex flex-col items-center justify-between gap-8 border-t border-stone-200 pt-16 md:flex-row">
            <div className="text-left w-full md:w-auto">
              <h2 className="font-serif text-5xl italic text-[#1C1C1C]">La Galerie</h2>
              <p className="mt-2 text-sm text-stone-500 uppercase tracking-[0.1em] font-medium">
                Explorez l&apos;inspiration de la communauté
              </p>
            </div>

            <div className="relative w-full md:w-[450px]">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r border-stone-200 pr-3 pointer-events-none">
                <Search className="text-[#8d5f9e]" size={18} strokeWidth={2.5} />
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="RECHERCHER UN STYLE, UNE MARQUE..."
                className="w-full h-14 rounded-full border-stone-200 bg-white pl-16 pr-6 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all focus:ring-2 focus:ring-[#C9A0CD]/20 focus:border-[#C9A0CD]"
              />
            </div>
          </div>

          {filteredCompositions.length > 0 ? (
            <>
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedCompositions.map((composition) => (
                  <CompositionCard key={composition.id} composition={composition} onOpen={setActiveComposition} />
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-[28px] border border-white/80 bg-white/55 p-4 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
                    Showing {(safePage - 1) * GALLERY_PAGE_SIZE + 1}-{Math.min(safePage * GALLERY_PAGE_SIZE, filteredCompositions.length)} of {filteredCompositions.length} looks
                  </p>
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    Page {safePage} / {pageCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage <= 1}
                    className={cn(
                      "inline-flex h-10 items-center rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                      safePage > 1
                        ? "bg-white text-[#8d5f9e] ring-[#C9A0CD]/25 hover:bg-[#f7f1fb]"
                        : "cursor-not-allowed bg-white/60 text-stone-300 ring-stone-100",
                    )}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                    disabled={safePage >= pageCount}
                    className={cn(
                      "inline-flex h-10 items-center rounded-full px-4 text-[9px] font-black uppercase tracking-[0.18em] ring-1 transition",
                      safePage < pageCount
                        ? "bg-[#1C1C1C] text-white ring-[#1C1C1C] hover:bg-[#8d5f9e]"
                        : "cursor-not-allowed bg-white/60 text-stone-300 ring-stone-100",
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-stone-50/50">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl mb-6">
                <Filter className="text-stone-300" size={32} />
              </div>
              <h3 className="font-serif text-3xl italic text-stone-800">Aucun résultat</h3>
              <p className="mt-2 text-stone-400 font-medium">
                Essayez d&apos;autres mots-clés ou explorez les tendances.
              </p>
            </div>
          )}
        </section>

        {/* Pied de page */}
        <footer className="mt-32 border-t border-stone-100 py-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
          © {new Date().getFullYear()} CABINE STUDIO — PARIS / BRUXELLES
        </footer>
      </div>

      {activeComposition && (
        <CompositionModal composition={activeComposition} onClose={() => setActiveComposition(null)} />
      )}
    </main>
  );
}
