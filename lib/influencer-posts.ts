import { slugifyCatalogText } from "@/lib/catalog";

export function getInfluencerPostSlug(post: {
  id: number | string;
  caption?: string | null;
  contentPillar?: string | null;
  influencer?: {
    displayName?: string | null;
  } | null;
}) {
  const title = post.caption?.split(".")[0] || post.contentPillar || post.influencer?.displayName || "agent-look";
  const slug = slugifyCatalogText(title) || "agent-look";

  return `${post.id}-${slug}`;
}

export function getInfluencerPostHref(post: {
  id: number | string;
  caption?: string | null;
  contentPillar?: string | null;
  influencer?: {
    displayName?: string | null;
  } | null;
}) {
  return `/lookbook/posts/${getInfluencerPostSlug(post)}`;
}

export function getInfluencerPostIdFromSlug(slug: string) {
  const id = Number.parseInt(slug.split("-")[0] || "", 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
