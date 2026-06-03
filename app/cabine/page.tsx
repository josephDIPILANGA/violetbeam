"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Aperture,
  Camera,
  Check,
  ChevronUp,
  Footprints,
  Glasses,
  HatGlasses,
  Layers,
  Loader2,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Sun,
  Trash2,
  Clock,
  Upload,
  UserRound,
  Watch,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MODULE_ICON_MAP, type CatalogModule, type ModuleIconName } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Article = {
  id: string;
  name: string;
  brand: string;
  image: string;
  prompt: string;
  description?: string;
  price?: number | string;
  currency?: string;
  shopUrl?: string;
};

type Module = {
  id: string;
  label: string;
  type: "article" | "direction";
  icon: React.ElementType;
  accent: string;
  options: Article[];
};

type Selection = Article & {
  moduleId: string;
  moduleLabel: string;
};

type HistoryItem = {
  id: number;
  url: string;
  title: string;
  selections: Record<string, Selection>;
  createdAt: string;
  prompt?: string;
  compositionId?: number;
  validatedAt?: string;
  validatedSignature?: string;
};

const DATABASE_PROFILE_IMAGE: string | null = null;
const CABINE_HISTORY_STORAGE_KEY = "cabine:generated-compositions";

const ARTICLE_MODULES: Module[] = [
  {
    id: "shirts",
    label: "Chemises",
    type: "article",
    icon: Shirt,
    accent: "bg-gradient-to-br from-[#fbf9ff] via-[#f3edf9] to-[#e7e4e0]",
    options: [
      {
        id: "shirt-ivory",
        name: "Chemise ivoire",
        brand: "Atelier 08",
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c717658?auto=format&fit=crop&q=80&w=600",
        prompt: "chemise fluide ivoire en soie, col souple, coupe elegante",
      },
      {
        id: "shirt-blue",
        name: "Chemise oxford",
        brand: "North Line",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600",
        prompt: "chemise oxford bleu clair, coton structure, coupe droite",
      },
      {
        id: "shirt-linen",
        name: "Chemise lin",
        brand: "Rivage",
        image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&q=80&w=600",
        prompt: "chemise en lin naturel, texture respirante, coupe ete",
      },
      {
        id: "shirt-black",
        name: "Chemise noire",
        brand: "Noir Studio",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600",
        prompt: "chemise noire minimaliste, tissu mat, silhouette nette",
      },
    ],
  },
  {
    id: "pulls",
    label: "Pulls",
    type: "article",
    icon: Layers,
    accent: "bg-gradient-to-br from-[#fcfaff] via-[#f0e8f6] to-[#e8e4df]",
    options: [
      {
        id: "pull-cashmere",
        name: "Pull cachemire",
        brand: "Maison Ligne",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600",
        prompt: "pull cachemire beige, maille douce, volume leger",
      },
      {
        id: "pull-roll",
        name: "Col roule",
        brand: "Nord",
        image: "https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?auto=format&fit=crop&q=80&w=600",
        prompt: "pull col roule noir, maille fine, style sobre",
      },
      {
        id: "pull-cardigan",
        name: "Cardigan laine",
        brand: "Loom",
        image: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&q=80&w=600",
        prompt: "cardigan laine epaisse, boutons discrets, coupe relax",
      },
      {
        id: "pull-zip",
        name: "Demi-zip",
        brand: "Studio P",
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=600",
        prompt: "pull demi-zip gris, esprit premium casual",
      },
    ],
  },
  {
    id: "bottoms",
    label: "Pantalons",
    type: "article",
    icon: Layers,
    accent: "bg-gradient-to-br from-[#fbf8ff] via-[#eee6f5] to-[#e6e4df]",
    options: [
      {
        id: "bottom-tailor",
        name: "Pantalon tailleur",
        brand: "Maison Ligne",
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=600",
        prompt: "pantalon tailleur noir, jambes droites, plis nets",
      },
      {
        id: "bottom-denim",
        name: "Jean brut",
        brand: "Rive Studio",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
        prompt: "jean brut indigo, coupe droite, denim dense",
      },
      {
        id: "bottom-cargo",
        name: "Cargo technique",
        brand: "Urban Form",
        image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=600",
        prompt: "pantalon cargo technique, poches discretes, coupe moderne",
      },
      {
        id: "bottom-wide",
        name: "Pantalon large",
        brand: "Lento",
        image: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&q=80&w=600",
        prompt: "pantalon large fluide, tissu leger, silhouette ample",
      },
    ],
  },
  {
    id: "caps",
    label: "Casquettes",
    type: "article",
    icon: HatGlasses,
    accent: "bg-gradient-to-br from-[#faf8ff] via-[#f1e9f7] to-[#e7e4e0]",
    options: [
      {
        id: "cap-black",
        name: "Casquette noire",
        brand: "Everyday",
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600",
        prompt: "casquette noire minimaliste, coton epais, sans logo visible",
      },
      {
        id: "cap-denim",
        name: "Casquette denim",
        brand: "Rive Studio",
        image: "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&q=80&w=600",
        prompt: "casquette denim bleu, texture casual, visiere courbe",
      },
      {
        id: "cap-beige",
        name: "Casquette beige",
        brand: "Solace",
        image: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&q=80&w=600",
        prompt: "casquette beige coton, style propre et discret",
      },
      {
        id: "cap-green",
        name: "Casquette verte",
        brand: "Forest",
        image: "https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&q=80&w=600",
        prompt: "casquette vert profond, coton brosse, look urbain",
      },
    ],
  },
  {
    id: "shoes",
    label: "Chaussures",
    type: "article",
    icon: Footprints,
    accent: "bg-gradient-to-br from-[#fbf9ff] via-[#efe7f6] to-[#e5e2de]",
    options: [
      {
        id: "shoe-white",
        name: "Baskets blanches",
        brand: "Solace",
        image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=600",
        prompt: "baskets cuir blanc minimalistes, semelle nette",
      },
      {
        id: "shoe-loafers",
        name: "Mocassins cuir",
        brand: "Cordon",
        image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=600",
        prompt: "mocassins cuir noir, finition polie, style habille",
      },
      {
        id: "shoe-runner",
        name: "Sneakers running",
        brand: "Pulse",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600",
        prompt: "sneakers running rouges, silhouette sportive",
      },
      {
        id: "shoe-boots",
        name: "Bottines",
        brand: "Marche",
        image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=600",
        prompt: "bottines cuir brun, forme elegante, semelle fine",
      },
    ],
  },
  {
    id: "accessories",
    label: "Accessoires",
    type: "article",
    icon: Watch,
    accent: "bg-gradient-to-br from-[#fcfaff] via-[#f2ebf8] to-[#e8e4df]",
    options: [
      {
        id: "watch-silver",
        name: "Montre acier",
        brand: "Minute",
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600",
        prompt: "montre acier argente, cadran minimal, bracelet fin",
      },
      {
        id: "glasses-black",
        name: "Lunettes noires",
        brand: "Optik",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600",
        prompt: "lunettes de soleil noires, monture nette, style confident",
      },
      {
        id: "bag-leather",
        name: "Sac cuir",
        brand: "Carry",
        image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&q=80&w=600",
        prompt: "sac cuir noir, format compact, finition premium",
      },
      {
        id: "belt-brown",
        name: "Ceinture cuir",
        brand: "Cordon",
        image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&q=80&w=600",
        prompt: "ceinture cuir brun, boucle simple, style classique",
      },
    ],
  },
];

const DIRECTION_MODULES: Module[] = [
  {
    id: "pose",
    label: "Pose et attitude",
    type: "direction",
    icon: UserRound,
    accent: "bg-gradient-to-br from-[#f7f4fb] via-[#eee8f5] to-[#e1e5e2]",
    options: [
      { id: "pose-natural", name: "Naturelle", brand: "Pose", image: "", prompt: "pose naturelle debout, posture detendue" },
      { id: "pose-editorial", name: "Editoriale", brand: "Pose", image: "", prompt: "pose mode editoriale, ligne du corps elegante" },
      { id: "pose-walk", name: "En mouvement", brand: "Pose", image: "", prompt: "pose en marche, mouvement realiste du vetement" },
      { id: "pose-front", name: "Face camera", brand: "Pose", image: "", prompt: "pose face camera, plein pied, attitude neutre" },
    ],
  },
  {
    id: "lighting",
    label: "Studio lighting",
    type: "direction",
    icon: Sun,
    accent: "bg-gradient-to-br from-[#f9f5fb] via-[#efe6f3] to-[#e7e1dc]",
    options: [
      { id: "light-soft", name: "Softbox", brand: "Lumiere", image: "", prompt: "lumiere studio douce, ombres propres" },
      { id: "light-day", name: "Jour naturel", brand: "Lumiere", image: "", prompt: "lumiere naturelle douce, rendu realiste" },
      { id: "light-contrast", name: "Contraste", brand: "Lumiere", image: "", prompt: "lumiere contrastee, rendu editorial premium" },
      { id: "light-high", name: "High key", brand: "Lumiere", image: "", prompt: "studio high key, fond clair, peau naturelle" },
    ],
  },
  {
    id: "angle",
    label: "Shot angle",
    type: "direction",
    icon: Camera,
    accent: "bg-gradient-to-br from-[#f6f4fb] via-[#eae6f4] to-[#dde4e5]",
    options: [
      { id: "angle-full", name: "Plein pied", brand: "Cadre", image: "", prompt: "photo plein pied, corps entier visible" },
      { id: "angle-three", name: "Trois-quarts", brand: "Cadre", image: "", prompt: "vue trois-quarts, proportions naturelles" },
      { id: "angle-portrait", name: "Portrait mode", brand: "Cadre", image: "", prompt: "cadre portrait mode, haut du corps dominant" },
      { id: "angle-low", name: "Leger contre-plongee", brand: "Cadre", image: "", prompt: "angle legerement bas, silhouette valorisee" },
    ],
  },
  {
    id: "background",
    label: "Fond",
    type: "direction",
    icon: Aperture,
    accent: "bg-gradient-to-br from-[#f8f5fb] via-[#eee8f4] to-[#e2e1e7]",
    options: [
      { id: "bg-white", name: "Studio blanc", brand: "Fond", image: "", prompt: "fond studio blanc propre" },
      { id: "bg-street", name: "Rue sobre", brand: "Fond", image: "", prompt: "fond rue urbaine sobre, leger flou" },
      { id: "bg-home", name: "Interieur", brand: "Fond", image: "", prompt: "fond interieur minimal, lumiere calme" },
      { id: "bg-showroom", name: "Showroom", brand: "Fond", image: "", prompt: "fond showroom mode, ambiance premium" },
    ],
  },
  {
    id: "render",
    label: "Rendu",
    type: "direction",
    icon: Sparkles,
    accent: "bg-gradient-to-br from-[#faf7fc] via-[#efe7f4] to-[#e6e1dc]",
    options: [
      { id: "render-real", name: "Photorealiste", brand: "Rendu", image: "", prompt: "rendu photorealiste, texture textile precise" },
      { id: "render-ecom", name: "E-commerce", brand: "Rendu", image: "", prompt: "photo e-commerce premium, vetement lisible" },
      { id: "render-fashion", name: "Fashion week", brand: "Rendu", image: "", prompt: "rendu fashion week, style haut de gamme" },
      { id: "render-clean", name: "Clean", brand: "Rendu", image: "", prompt: "rendu propre, couleurs fideles, sans artefact" },
    ],
  },
];

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 101,
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
    title: "Look archive 1",
    selections: {},
    createdAt: new Date(0).toISOString(),
  },
  {
    id: 102,
    url: "https://images.unsplash.com/photo-1539109132314-347f8541815b?auto=format&fit=crop&q=80&w=600",
    title: "Look archive 2",
    selections: {},
    createdAt: new Date(0).toISOString(),
  },
  {
    id: 103,
    url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600",
    title: "Look archive 3",
    selections: {},
    createdAt: new Date(0).toISOString(),
  },
];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createCompositionSignature(selections: Record<string, Selection>) {
  return Object.values(selections)
    .map((item) => `${item.moduleId}:${item.id}`)
    .sort()
    .join("|");
}

function createCompositionName(items: Selection[]) {
  const articleItems = items.filter((item) => !DIRECTION_MODULES.some((module) => module.id === item.moduleId));
  const sourceItems = articleItems.length > 0 ? articleItems : items;
  const names = sourceItems.map((item) => item.name).filter(Boolean);

  if (names.length === 0) return "Mon Look";
  if (names.length === 1) return `Look ${names[0]}`;
  if (names.length === 2) return `${names[0]} + ${names[1]}`;

  return `${names[0]} + ${names[1]} + ${names.length - 2} pieces`;
}

function normalizeHistory(items: HistoryItem[]) {
  return items.map((item) => ({
    ...item,
    selections: item.selections ?? {},
    validatedSignature:
      item.validatedSignature ??
      (item.compositionId ? createCompositionSignature(item.selections ?? {}) : undefined),
  }));
}

export default function CabinePage() {
  const [profileImage, setProfileImage] = useState<string | null>(DATABASE_PROFILE_IMAGE);
  const [currentImage, setCurrentImage] = useState<string | null>(DATABASE_PROFILE_IMAGE);
  const [history, setHistory] = useState<HistoryItem[]>(() => normalizeHistory(INITIAL_HISTORY));
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const [catalogArticleModules, setCatalogArticleModules] = useState<Module[]>(ARTICLE_MODULES);
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [search, setSearch] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedSignature, setLastGeneratedSignature] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [activeSelectionModuleId, setActiveSelectionModuleId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const hasAppliedCatalogSelection = useRef(false);
  const selectedItems = useMemo(() => Object.values(selections), [selections]);
  const modules = useMemo(() => [...catalogArticleModules, ...DIRECTION_MODULES], [catalogArticleModules]);
  const activeSelection = activeSelectionModuleId ? selections[activeSelectionModuleId] : null;
  const currentCompositionSignature = useMemo(() => createCompositionSignature(selections), [selections]);
  const canGenerate = selectedItems.length > 0 && currentCompositionSignature !== lastGeneratedSignature;
  const activeHistoryItem = useMemo(
    () => history.find((item) => item.id === activeHistoryId),
    [activeHistoryId, history]
  );
  const hasValidatedCurrentComposition = Boolean(
    activeHistoryItem?.compositionId &&
      activeHistoryItem.validatedSignature === currentCompositionSignature
  );
  const canValidate =
    Boolean(activeHistoryId) &&
    selectedItems.length > 0 &&
    currentCompositionSignature === lastGeneratedSignature &&
    !hasValidatedCurrentComposition;

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem(CABINE_HISTORY_STORAGE_KEY);
      if (!storedHistory) {
        setIsHistoryReady(true);
        return;
      }

      const parsedHistory = JSON.parse(storedHistory) as HistoryItem[];
      if (Array.isArray(parsedHistory)) {
        setHistory(normalizeHistory(parsedHistory));
      }
    } catch {
      setHistory(normalizeHistory(INITIAL_HISTORY));
    } finally {
      setIsHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isHistoryReady) return;

    try {
      window.localStorage.setItem(CABINE_HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      toast.error("L'historique local est plein. Supprimez quelques images avant de continuer.");
    }
  }, [history, isHistoryReady]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/articles")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { modules?: CatalogModule[] } | null) => {
        if (!isMounted || !data?.modules?.length) return;

        const nextModules = data.modules
          .filter((module) => module.options.length > 0)
          .map((module): Module => ({
            id: module.id,
            label: module.label,
            type: "article",
            icon: MODULE_ICON_MAP[module.iconName as ModuleIconName] ?? Shirt,
            accent: module.accent,
            options: module.options,
          }));

        if (nextModules.length > 0) {
          setCatalogArticleModules(nextModules);
        }
      })
      .catch(() => {
        setCatalogArticleModules(ARTICLE_MODULES);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasAppliedCatalogSelection.current || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const moduleId = params.get("module");
    const articleId = params.get("article");

    if (!moduleId || !articleId) return;

    const module = catalogArticleModules.find((entry) => entry.id === moduleId);
    const option = module?.options.find((entry) => entry.id === articleId);

    if (!module || !option) return;

    hasAppliedCatalogSelection.current = true;
    setSelections((previous) => ({
      ...previous,
      [module.id]: {
        ...option,
        moduleId: module.id,
        moduleLabel: module.label,
      },
    }));
    setActiveSelectionModuleId(module.id);
    setActiveHistoryId(null);
    setLastGeneratedSignature(null);
    setActiveModule(null);
    setSearch("");
    toast.success("Article ajoute a la cabine.");
  }, [catalogArticleModules]);

  const filteredOptions = useMemo(() => {
    if (!activeModule) return [];
    const value = search.trim().toLowerCase();
    if (!value) return activeModule.options;

    return activeModule.options.filter((option) =>
      [option.name, option.brand, option.prompt].some((entry) => entry.toLowerCase().includes(value))
    );
  }, [activeModule, search]);

  const generationPrompt = useMemo(() => {
    const articles = selectedItems.map((item, index) => `Reference image ${index + 2} - ${item.moduleLabel}: ${item.prompt}`).join(". ");
    return [
      "Create a photorealistic virtual try-on image.",
      "Use reference image 1 as the person/avatar. Preserve the person's identity, face, skin tone, body proportions, posture, and overall silhouette.",
      articles ? `Use the following product reference images as strict visual references: ${articles}.` : "No clothing product reference selected.",
      "Apply the selected clothing items onto the person without redesigning them.",
      "Preserve each garment's exact color, cut, fit, fabric texture, pattern, collar, buttons, sleeves, seams, length, and visible details.",
      "Do not invent logos, text, patterns, pockets, accessories, or alternate colors.",
      "The final image should look like a premium fashion e-commerce preview with realistic lighting and readable textiles.",
    ].join(" ");
  }, [selectedItems]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit etre une image.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setProfileImage(dataUrl);
    setCurrentImage(dataUrl);
    setSelections({});
    setLastGeneratedSignature(null);
    setActiveHistoryId(null);
    setActiveSelectionModuleId(null);
    setActiveModule(null);
    setSearch("");
    event.target.value = "";
    toast.success("Nouvelle composition initialisee.");
  };

  const resetCabine = () => {
    setCurrentImage(profileImage);
    setSelections({});
    setLastGeneratedSignature(null);
    setActiveHistoryId(null);
    setActiveSelectionModuleId(null);
    setActiveModule(null);
    setSearch("");
    toast.info("Cabine remise par defaut.");
  };

  const deleteHistoryItem = (id: number) => {
    setHistory((items) => items.filter((item) => item.id !== id));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
      setActiveSelectionModuleId(null);
    }
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setCurrentImage(item.url);
    setSelections(item.selections ?? {});
    setLastGeneratedSignature(createCompositionSignature(item.selections ?? {}));
    setActiveHistoryId(item.id);
    setActiveSelectionModuleId(null);
  };

  const handleValidateComposition = async () => {
    if (!currentImage || selectedItems.length === 0 || !activeHistoryId) {
      toast.error("Aucune composition a valider.");
      return;
    }

    if (currentCompositionSignature !== lastGeneratedSignature) {
      toast.info("Generez d'abord une nouvelle image avec cette composition.");
      return;
    }

    if (hasValidatedCurrentComposition) {
      toast.info("Cette composition est deja validee.");
      return;
    }

    setIsValidating(true);

    try {
      const isUpdate = Boolean(activeHistoryItem?.compositionId);
      const compositionName = createCompositionName(selectedItems);
      const response = await fetch(
        isUpdate ? `/api/compositions/${activeHistoryItem?.compositionId}` : "/api/compositions",
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generatedUrl: currentImage,
            prompt: activeHistoryItem?.prompt ?? generationPrompt,
            items: selectedItems,
            name: compositionName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Validation impossible.");
      }

      setHistory((items) =>
        items.map((item) =>
          item.id === activeHistoryId
            ? {
                ...item,
                url: currentImage,
                title: compositionName,
                selections: JSON.parse(JSON.stringify(selections)),
                prompt: activeHistoryItem?.prompt ?? generationPrompt,
                compositionId: data.id ?? item.compositionId,
                validatedAt: data.updatedAt ?? data.createdAt ?? new Date().toISOString(),
                validatedSignature: currentCompositionSignature,
              }
            : item
        )
      );

      toast.success(isUpdate ? "Composition mise a jour." : "Image et composition enregistrees.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur pendant la validation.");
    } finally {
      setIsValidating(false);
    }
  };

  const chooseOption = (module: Module, option: Article) => {
    setSelections((previous) => ({
      ...previous,
      [module.id]: {
        ...option,
        moduleId: module.id,
        moduleLabel: module.label,
      },
    }));
    setActiveModule(null);
    setSearch("");
  };

  const removeSelection = (moduleId: string) => {
    setSelections((previous) => {
      const next = { ...previous };
      delete next[moduleId];
      return next;
    });
    setActiveSelectionModuleId((current) => (current === moduleId ? null : current));
  };

  const handleGenerate = async () => {
    const tryOnBaseImage = profileImage ?? currentImage;

    if (!tryOnBaseImage) {
      toast.error("Ajoutez d'abord une photo de vous.");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Selectionnez au moins un article ou un reglage.");
      return;
    }

    if (!canGenerate) {
      toast.info("Modifiez la composition avant de relancer un try-on.");
      return;
    }

    setIsGenerating(true);

    try {
      const garments = selectedItems.filter((item) => catalogArticleModules.some((module) => module.id === item.moduleId));
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImage: tryOnBaseImage,
          garmentImages: garments.map((item) => item.image).filter(Boolean),
          garmentName: garments.map((item) => item.name).join(", "),
          articleDescription: selectedItems.map((item) => item.prompt).join(", "),
          prompt: generationPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "AUTH_REQUIRED") {
          toast.info("Connexion requise pour generer une image.");
          window.location.href = "/sign-in";
          return;
        }

        if (data.code === "NO_CREDITS") {
          toast.info("Credits insuffisants. Choisissez un abonnement.");
          window.location.href = "/billing";
          return;
        }

        throw new Error(data.error || "Generation impossible.");
      }

      const nextImage = String(data.imageUrl);
      const compositionSelections = JSON.parse(JSON.stringify(selections)) as Record<string, Selection>;
      const compositionName = createCompositionName(selectedItems);
      const nextHistoryItem: HistoryItem = {
        id: Date.now(),
        url: nextImage,
        title: compositionName,
        selections: compositionSelections,
        createdAt: new Date().toISOString(),
        prompt: generationPrompt,
        compositionId: activeHistoryItem?.compositionId,
        validatedAt: activeHistoryItem?.validatedAt,
        validatedSignature: activeHistoryItem?.validatedSignature,
      };

      setCurrentImage(nextImage);
      setLastGeneratedSignature(currentCompositionSignature);
      setActiveHistoryId(nextHistoryItem.id);
      setHistory((items) => [nextHistoryItem, ...items].slice(0, 12));
      toast.success(data.demo ? "Rendu demo ajoute a l'historique." : "Look genere.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur pendant la generation.");
    } finally {
      setIsGenerating(false);
    }
  };

return (
    <main className="min-h-screen bg-[#F7F4F2] text-[#1A1A1A] font-sans selection:bg-[#D4AF37]/30">

      {/* STYLE GLOBAL POUR LES POLICES ET ANIMATIONS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,500;1,400&family=Inter:wght@300;400;600&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      {/* Importation de la police Bebas Neue via Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        
        .font-bebas {
          font-family: 'Bebas Neue', sans-serif;
        }
      `}</style>


      <div className="mx-auto flex max-w-[96rem] flex-col gap-8 px-6 py-10 lg:px-10 xl:px-12">

              {/* HEADER ÉDITORIAL */}
      {/* Hauteur diminuée de moitié (min-h-[300px]) et ajout de overflow-visible pour laisser l'image dépasser */}
      <header className="relative drop-shadow w-full min-h-[210px] flex flex-col md:flex-row items-center justify-between px-[5%] md:px-[8%] bg-gradient-to-br from-[#fdfcff] to-[#f3efff] overflow-hidden mb-12">
        
        {/* Section Texte (Gauche) */}
        <div className="z-20 flex-1 py-6">
          <h1 className="font-bebas italic text-[clamp(3.5rem,8vw,9rem)] leading-[0.85] text-gray-900 select-none tracking-tighter drop-shadow-sm">
            LA <br /> CABINE
          </h1>
          
          <div className="mt-3 flex items-center gap-4">
            <div className="h-[1px] w-12 bg-gray-400"></div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-purple-900/40 font-semibold">
              Digital Editorial — Edition 2024
            </p>
          </div>
        </div>

        {/* Section Image (Droite) avec dépassement par le bas */}
        <div className="relative flex-1 flex justify-end items-center h-full w-full">
          {/* Grand cercle en background du personnage */}
          <div className="absolute top-1/2 left-1/2 md:left-2/3 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] md:w-[340px] md:h-[340px] rounded-full bg-gradient-to-r from-purple-400/20 via-purple-100/10 to-transparent z-0"></div>
          <div className="absolute top-[-260px] right-0 z-10 md:bottom-[-160px]">
            {/* L'image utilise une position absolue ou une translation pour dépasser par le bas */}
            <div className="relative h-[470px] w-[340px] transition-transform md:h-[610px] md:w-[445px]">
              <Image
                src="/personnage/women-banner.png" 
                alt="Mannequin La Cabine" 
                fill
                priority
                sizes="(min-width: 768px) 445px, 340px"
                className="object-contain drop-shadow-2xl"
                onError={(e) => {
                    // Fallback visuel si l'image locale n'est pas encore présente
                    e.currentTarget.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000";
                    e.currentTarget.className = "h-full w-auto object-contain grayscale opacity-50";
                }}
              />
            </div>
          </div>
        </div>
        {/* Élément décoratif subtil en arrière-plan global */}
        <div className="absolute top-0 right-0 w-[400px] h-full bg-purple-100/20 blur-[80px] rounded-full pointer-events-none"></div>
      </header>

        {/* ARCHIVES / HISTORIQUE */}
        <section className="rounded-[28px] border border-white/70 bg-white/60 p-4 shadow-[0_24px_70px_-45px_rgba(92,54,118,0.55)] backdrop-blur-2xl">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-1">
            <div className="flex shrink-0 items-center gap-3 pr-5 border-r border-[#C9A0CD]/25">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#f7f1fb] text-[#8d5f9e]">
                <Clock size={15} />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Archives</p>
                <p className="mt-1 text-[10px] font-semibold text-stone-400">{history.length} looks</p>
              </div>
            </div>
            {history.map((item) => (
              <div key={item.id} className="group relative shrink-0">
                <button
                  onClick={() => selectHistoryItem(item)}
                  className={cn(
                    "h-28 w-20 overflow-hidden rounded-2xl bg-[#f7f1fb] shadow-sm ring-1 ring-white/70 transition-all duration-500 ease-out",
                    currentImage === item.url
                      ? "scale-105 ring-2 ring-[#8d5f9e] ring-offset-4 ring-offset-[#FDFBFF]"
                      : "opacity-60 grayscale hover:-translate-y-0.5 hover:opacity-100 hover:grayscale-0 hover:shadow-xl hover:shadow-purple-900/10"
                  )}
                >
                  <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
                </button>
                <button
                  onClick={() => deleteHistoryItem(item.id)}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[#1C1C1C] text-white opacity-0 shadow-xl transition-all hover:bg-[#8d5f9e] group-hover:opacity-100"
                  aria-label="Supprimer l'image"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={resetCabine}
              className="flex h-28 w-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-[#C9A0CD]/45 bg-white/45 text-[#8d5f9e] transition-all hover:-translate-y-0.5 hover:border-[#8d5f9e] hover:bg-white hover:shadow-xl hover:shadow-purple-900/10"
              aria-label="Réinitialiser la cabine"
            >
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </section>

        {/* GRILLE PRINCIPALE */}
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(72px,3fr)] items-stretch gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_280px_500px] lg:gap-8">
          
          {/* VISUALISEUR (L'ŒUVRE) */}
          <section className="relative h-[520px] group overflow-hidden bg-[#EAE8E4] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-transform duration-700 sm:h-[620px] lg:h-[720px]">
            {currentImage ? (
              <img src={currentImage} alt="Rendu" className={cn("h-full w-full object-cover transition-all duration-1000 ease-in-out", isGenerating && "scale-110 blur-xl opacity-70")} />
            ) : (
              <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-6 px-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-[#A89276]/20"></div>
                  <span className="relative flex size-20 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm">
                    <UserRound size={28} strokeWidth={1} className="text-stone-400" />
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="font-serif text-2xl italic text-stone-800">Commencer la Création</p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">Importez une silhouette de référence</p>
                </div>
                <span className="inline-flex items-center gap-3 bg-[#1C1C1C] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-transform hover:scale-105 active:scale-95">
                  <Upload size={14} /> Explorer
                </span>
                <input className="sr-only" type="file" accept="image/*" onChange={handleUpload} />
              </label>
            )}

            {/* OVERLAY : ARTICLE ACTIF */}
            {activeSelection && (
              <div className="absolute right-3 top-3 w-[min(13rem,calc(100%-1.5rem))] animate-in fade-in slide-in-from-right-4 duration-300 sm:right-6 sm:top-6 sm:w-64">
                <div className="group/item flex items-center gap-3 bg-white/95 p-2 pr-3 shadow-sm backdrop-blur-md sm:gap-4 sm:pr-4">
                  {activeSelection.image ? (
                    <img src={activeSelection.image} alt={activeSelection.name} className="size-10 object-cover grayscale transition-all group-hover/item:grayscale-0 sm:size-12" />
                  ) : (
                    <div className="flex size-10 items-center justify-center bg-stone-100 text-stone-400 sm:size-12">
                      <Check size={14} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[8px] font-bold uppercase tracking-[0.2em] text-[#A89276]">{activeSelection.moduleLabel}</p>
                    <p className="truncate text-[11px] font-semibold text-[#1C1C1C]">{activeSelection.name}</p>
                  </div>
                  <button onClick={() => removeSelection(activeSelection.moduleId)} className="text-stone-300 transition-colors hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* LOADER OVERLAY */}
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-md transition-all duration-500">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 border-t-2 border-l-2 border-[#1C1C1C] animate-spin rounded-full"></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#1C1C1C] animate-pulse">Traitement IA...</span>
                </div>
              </div>
            )}
          </section>

          {/* ACTIONS & ARTICLES */}
          <section className="flex h-[520px] flex-col rounded-[20px] border border-white/70 bg-white/75 p-2 shadow-[0_24px_70px_-35px_rgba(92,54,118,0.45)] backdrop-blur-xl sm:h-[620px] sm:rounded-[24px] sm:p-4 lg:h-[720px] lg:rounded-[28px] lg:p-5">
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate}
                className="h-10 w-full gap-2 rounded-full bg-gradient-to-r from-[#1C1C1C] to-[#4f365f] px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg transition-all duration-300 hover:from-black hover:to-[#5f3d72] disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:gap-3 sm:px-5"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} className="text-[#E7C9EC]" />}
                <span className="hidden sm:inline">TRY ON</span>
              </Button>
              <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white text-[10px] font-bold uppercase tracking-[0.18em] text-[#4f365f] shadow-sm ring-1 ring-[#C9A0CD]/25 transition-colors hover:bg-[#fbf7ff] sm:h-11 sm:gap-3">
                <Upload size={13} />
                <span className="hidden sm:inline">Upload</span>
                <input className="sr-only" type="file" accept="image/*" onChange={handleUpload} />
              </label>
              <button
                onClick={handleValidateComposition}
                disabled={isValidating || !canValidate}
                className={cn(
                  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[10px] font-bold uppercase tracking-[0.18em] text-[#4f365f] shadow-sm ring-1 ring-[#C9A0CD]/25 transition-colors hover:bg-[#fbf7ff] disabled:cursor-not-allowed disabled:opacity-45 sm:h-11 sm:gap-3",
                  hasValidatedCurrentComposition && "bg-gradient-to-r from-[#8d5f9e] to-[#C9A0CD] text-white ring-transparent hover:from-[#8d5f9e] hover:to-[#C9A0CD] disabled:opacity-100"
                )}
                title="Valider la composition"
              >
                {isValidating ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />}
                <span className="hidden sm:inline">Valider</span>
              </button>
            </div>

            <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-[#C9A0CD]/45 to-transparent sm:my-6 lg:my-7" />

            <div className="min-h-0 flex-1">
              <div className="mb-3 flex items-center justify-center sm:mb-4 sm:justify-between">
                <span className="hidden text-[9px] font-bold uppercase tracking-[0.25em] text-[#8d5f9e]/70 sm:inline">Articles</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-300">{selectedItems.length}</span>
              </div>

              {selectedItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1 no-scrollbar sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
                  {selectedItems.map((item) => (
                    <button
                      key={item.moduleId}
                      onClick={() =>
                        setActiveSelectionModuleId((current) => (current === item.moduleId ? null : item.moduleId))
                      }
                      className={cn(
                        "aspect-square overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#C9A0CD]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl",
                        activeSelectionModuleId === item.moduleId && "ring-2 ring-[#8d5f9e] ring-offset-2"
                      )}
                      title={item.name}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#f8f2fb] text-[#8d5f9e]">
                          <Check size={15} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-[#C9A0CD]/35 bg-white/50 px-2 text-center sm:h-32 sm:rounded-3xl sm:px-6">
                  <p className="text-[9px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-stone-300 sm:text-[10px] sm:tracking-[0.2em]">Aucun article</p>
                </div>
              )}
            </div>
          </section>

          {/* SÉLECTEUR DE MODULES (LE CATALOGUE) */}
          <section className="col-span-2 flex h-[720px] w-full flex-col rounded-none border border-stone-200 bg-white p-8 lg:col-span-1 lg:w-[500px]">
            <div className="mb-8 flex items-center justify-between border-b border-stone-100 pb-6">
              <div>
                <h2 className="font-serif text-3xl italic text-[#1C1C1C]">Catalogue</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1">Éléments de Composition</p>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-50 border border-stone-100">
                 <Glasses className="text-stone-400" size={18} strokeWidth={1.5} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2 no-scrollbar">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => {
                    setActiveModule(module);
                    setSearch("");
                  }}
                  className={cn(
                    "group drop-shadow relative flex flex-col items-start p-6 transition-all duration-500 border",
                    selections[module.id] 
                      ? "bg-stone-900 border-stone-900" 
                      : "bg-stone-50 border-stone-50 hover:bg-white hover:border-stone-200"
                  )}
                >
                  <div className={cn(
                    "mb-4 flex size-10 items-center justify-center transition-transform duration-500 group-hover:scale-110",
                    selections[module.id] ? "text-white" : "text-stone-400 group-hover:text-stone-900"
                  )}>
                    <module.icon size={20} strokeWidth={1} />
                  </div>
                  
                  <div className="text-left">
                    <span className={cn(
                      "block text-[10px] font-bold uppercase tracking-widest",
                      selections[module.id] ? "text-stone-400" : "text-stone-400"
                    )}>
                      {module.type === "article" ? "Vêtement" : "Direction"}
                    </span>
                    <span className={cn(
                      "block text-sm font-semibold tracking-tight mt-1",
                      selections[module.id] ? "text-white" : "text-stone-900"
                    )}>
                      {module.label}
                    </span>
                  </div>

                  {selections[module.id] && (
                    <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 w-full animate-in fade-in duration-700">
                      <div className="size-1 rounded-full bg-[#D4AF37]"></div>
                      <span className="text-[10px] font-medium text-white/80 truncate">
                        {selections[module.id].name}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* POPUP SÉLECTION (MODAL) */}
      {activeModule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0C0C0C]/80 p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-stone-100 p-8">
              <div className="flex items-center gap-6">
                <div className="flex size-14 items-center justify-center bg-stone-50 border border-stone-100 text-stone-900">
                  <activeModule.icon size={24} strokeWidth={1} />
                </div>
                <div>
                  <h3 className="font-serif text-4xl italic text-stone-900">{activeModule.label}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mt-1">Sélectionnez une pièce</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModule(null)} 
                className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
              >
                Fermer <X size={18} strokeWidth={1.5} className="transition-transform group-hover:rotate-90" />
              </button>
            </div>

            {/* SEARCH BAR (Style Minimal) */}
            <div className="px-8 py-4 bg-stone-50/50 border-b border-stone-100">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="RECHERCHER PAR NOM OU MARQUE..."
                  className="h-12 border-none bg-transparent pl-8 text-[11px] font-bold tracking-[0.15em] text-stone-900 placeholder:text-stone-300 focus-visible:ring-0"
                />
              </div>
            </div>

            {/* MODAL CONTENT */}
            <div className="max-h-[55vh] overflow-y-auto no-scrollbar p-8">
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => chooseOption(activeModule, option)}
                    className={cn(
                      "group relative flex flex-col text-left transition-all duration-500",
                      selections[activeModule.id]?.id === option.id ? "opacity-100" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <div className={cn(
                      "aspect-[3/4] overflow-hidden bg-stone-100 transition-all duration-700",
                      selections[activeModule.id]?.id === option.id 
                        ? "p-2 ring-1 ring-[#1C1C1C] ring-offset-4 shadow-2xl" 
                        : "border border-stone-100 group-hover:shadow-xl"
                    )}>
                      {activeModule.type === "article" ? (
                        <img src={option.image} alt={option.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-stone-50">
                          <activeModule.icon size={40} strokeWidth={0.5} className="text-stone-200" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#A89276]">{option.brand || "Studio"}</p>
                      <p className="text-[12px] font-semibold text-stone-900 leading-tight uppercase tracking-tight">{option.name}</p>
                    </div>
                    {selections[activeModule.id]?.id === option.id && (
                       <div className="absolute top-2 right-2 size-6 bg-[#1C1C1C] text-white flex items-center justify-center rounded-full shadow-lg">
                          <Check size={12} />
                       </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* MODAL FOOTER */}
            <div className="p-8 border-t border-stone-100 bg-white flex justify-end">
               <Button 
                onClick={() => setActiveModule(null)}
                className="rounded-none bg-[#1C1C1C] px-12 h-12 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-stone-800"
               >
                 Confirmer la sélection
               </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster 
        toastOptions={{
          className: 'rounded-none border border-stone-200 font-sans text-[11px] uppercase tracking-widest font-bold',
        }}
      />

    </main>
  );
}
