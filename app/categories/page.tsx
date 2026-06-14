import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Layers, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCatalogModuleMeta, MODULE_ICON_MAP, type ModuleIconName } from "@/lib/catalog";
import { getVisibleArticleWhere } from "@/lib/marketplace-visibility";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse VioletBeam catalog categories including dresses, shirts, pants, accessories, shoes, and more AI try-on ready pieces.",
  alternates: {
    canonical: "/categories",
  },
};

export default async function CategoriesPage() {
  const articles = await prisma.article.findMany({
    where: getVisibleArticleWhere(),
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      category: true,
      imageUrls: true,
    },
  });

  const categories = Array.from(
    articles.reduce((map, article) => {
      const existing = map.get(article.category);
      if (existing) {
        existing.count += 1;
        existing.images.push(article.imageUrls[0]);
      } else {
        map.set(article.category, {
          id: article.category,
          count: 1,
          images: [article.imageUrls[0]],
        });
      }
      return map;
    }, new Map<string, { id: string; count: number; images: (string | undefined)[] }>())
  ).map(([, value]) => value);

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              Product categories
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              Catégories
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-500">
              Parcourez les articles par type de pièce : robes, chemises, chaussures, accessoires et autres modules du catalogue.
            </p>
          </div>
          <Button asChild className="h-14 rounded-full bg-[#1C1C1C] px-7 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]">
            <Link href="/catalog">
              Catalog
              <Layers size={15} />
            </Link>
          </Button>
        </header>

        {categories.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              const meta = getCatalogModuleMeta(category.id);
              const Icon = MODULE_ICON_MAP[meta.iconName as ModuleIconName] ?? Layers;
              const image = category.images.find(Boolean);

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/10"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f3edf9]">
                    {image ? (
                      <img src={image} alt={meta.label} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8d5f9e]/60">
                        <Icon size={52} strokeWidth={1.2} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/40 to-transparent" />
                    <span className="absolute left-5 top-5 flex size-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-xl">
                      <Icon size={20} />
                    </span>
                  </div>
                  <div className="p-6">
                    <h2 className="font-serif text-4xl italic leading-none text-[#1C1C1C] transition-colors group-hover:text-[#8d5f9e]">
                      {meta.label}
                    </h2>
                    <div className="mt-6 flex items-center justify-between border-t border-stone-200/70 pt-5">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                        {category.count} articles
                      </span>
                      <ArrowUpRight size={16} className="text-stone-300 transition-colors group-hover:text-[#8d5f9e]" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-[40px] border-2 border-dashed border-stone-200 bg-white/50 text-center">
            <p className="text-sm font-semibold text-stone-400">Les catégories apparaîtront ici après import du catalogue.</p>
          </div>
        )}
      </div>
    </main>
  );
}
