import {
  User, Palette, Camera, Sun, Wand2,
  Smile, Package, Layout, Clock, Layers,
  Droplet, Sparkles, Crop, Ban, Hash,
  Shirt, Scissors, GraduationCap, Footprints, 
  Watch, Glasses, ShoppingBag
} from "lucide-react";

export const PROMPT_MODULES = [
  // --- STRUCTURE DE BASE ---
  { id: "model", label: "Model", icon: User, multiple: false },
  { id: "pose", label: "Pose & Attitude", icon: Smile, multiple: false },

  // --- VÊTEMENTS (APPAREL) ---
  { id: "tops", label: "Tops & Shirts", icon: Shirt, multiple: true },
  { id: "bottoms", label: "Pants & Skirts", icon: Layers, multiple: true },
  { id: "outerwear", label: "Coats & Jackets", icon: Package, multiple: true },
  { id: "dresses", label: "Dresses & Gowns", icon: GraduationCap, multiple: false },
  { id: "footwear", label: "Shoes", icon: Footprints, multiple: false },

  // --- ACCESSOIRES & DÉTAILS ---
  { id: "accessories", label: "Accessories", icon: Watch, multiple: true },
  { id: "eyewear", label: "Eyewear", icon: Glasses, multiple: false },
  { id: "jewelry", label: "Jewelry", icon: Sparkles, multiple: true },

  // --- ESTHÉTIQUE & TECHNIQUE ---
  { id: "textile", label: "Fabrics & Materials", icon: Scissors, multiple: true },
  { id: "style", label: "Fashion Style", icon: Palette, multiple: false },
  { id: "colorPalette", label: "Color Palette", icon: Droplet, multiple: false },
  { id: "era", label: "Fashion Era", icon: Clock, multiple: false },
  
  // --- STUDIO & RENDU ---
  { id: "lighting", label: "Studio Lighting", icon: Sun, multiple: false },
  { id: "camera", label: "Shot Angle", icon: Camera, multiple: false },
  { id: "composition", label: "Editorial Layout", icon: Layout, multiple: false },
  { id: "aspectRatio", label: "Frame Format", icon: Crop, multiple: false },

  // --- FILTRES ---
  { id: "negative", label: "Exclusions", icon: Ban, multiple: true },
  { id: 'tags', label: 'Editorial Tags', icon: Hash, multiple: true },
];

export const COLOR_PALETTES = [
  { label: "Old Money", colors: ["#F5F5DC", "#2C3E50", "#D4AF37"], value: "beige linen, navy blue, and subtle gold accents" },
  { label: "Vogue Noir", colors: ["#000000", "#1A1A1A", "#FFFFFF"], value: "high-contrast black and white, dramatic editorial style" },
  { label: "Spring Bloom", colors: ["#FFD1DC", "#B2F2BB", "#FEF9E7"], value: "soft cherry blossom pink, sage green and cream" },
  { label: "Cyber Tailoring", colors: ["#00FF41", "#0D0D0D", "#333333"], value: "technological black, dark charcoal with neon lime details" },
  { label: "Riviera", colors: ["#3498DB", "#FFFFFF", "#E67E22"], value: "mediterranean blue, crisp white and terracotta" },
  { label: "Earth Essence", colors: ["#6D4C41", "#A1887F", "#D7CCC8"], value: "raw terracotta, warm clay and oatmeal textures" },
];