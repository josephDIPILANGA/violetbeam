export type RewardAssetType = "GOLD" | "ESSENCE" | "DIAMOND";
export type ChampionCraftType = "CUTIE" | "GUERRIER" | "MONSTRE" | "DRAGON" | "GOD";

export type CraftCost = Partial<Record<RewardAssetType, number>>;

export const CHAMPION_CRAFT_COSTS: Record<ChampionCraftType, CraftCost> = {
  CUTIE: { GOLD: 80 },
  GUERRIER: { GOLD: 180 },
  MONSTRE: { GOLD: 420 },
  DRAGON: { GOLD: 900 },
  GOD: { GOLD: 1800 },
};

export const REWARD_ASSET_LABELS: Record<RewardAssetType, string> = {
  GOLD: "Gold",
  ESSENCE: "Essence",
  DIAMOND: "Diamond",
};
