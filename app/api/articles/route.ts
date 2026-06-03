import { prisma } from "@/lib/prisma";
import { getCatalogModuleMeta, type CatalogModule } from "@/lib/catalog";

export async function GET() {
  const articles = await prisma.article.findMany({
    orderBy: [
      {
        category: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      imageUrls: true,
      brand: true,
      brandRef: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          websiteUrl: true,
          popularity: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      shopUrl: true,
    },
  });

  const modulesById = new Map<string, CatalogModule>();

  for (const article of articles) {
    const moduleId = article.category;
    const meta = getCatalogModuleMeta(moduleId);
    const module =
      modulesById.get(moduleId) ??
      ({
        id: moduleId,
        label: meta.label,
        type: "article",
        iconName: meta.iconName,
        accent: meta.accent,
        options: [],
      } satisfies CatalogModule);

    module.options.push({
      id: `db-${article.id}`,
      name: article.title,
      brand: article.brandRef?.name || article.brand || "Cabine Market",
      image: article.imageUrls[0] || "",
      prompt: article.description || `${article.title} par ${article.brandRef?.name || article.brand || "Cabine Market"}`,
      description: article.description || undefined,
      price: Number(article.price),
      currency: "USD",
      shopUrl: article.shopUrl || undefined,
      brandId: article.brandRef?.id,
      brandSlug: article.brandRef?.slug,
      brandLogoUrl: article.brandRef?.logoUrl || undefined,
      brandWebsiteUrl: article.brandRef?.websiteUrl || undefined,
      brandPopularity: article.brandRef?.popularity,
      tags: article.tags.map((entry) => entry.tag.name || entry.tag.slug),
    });

    modulesById.set(moduleId, module);
  }

  return Response.json({
    modules: Array.from(modulesById.values()),
  });
}
