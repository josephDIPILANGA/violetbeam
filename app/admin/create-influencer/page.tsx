import { Sparkles } from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import CreateInfluencerForm from "./create-influencer-form";

export const dynamic = "force-dynamic";

export default async function CreateInfluencerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const mode = resolvedSearchParams.mode;
  const rawId = resolvedSearchParams.id;
  const updateId = mode === "update" && typeof rawId === "string" ? Number(rawId) : null;
  const initialInfluencer = updateId
    ? await prisma.virtualInfluencer.findUnique({
        where: {
          id: updateId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          username: true,
          emailAlias: true,
          bio: true,
          profileImageUrl: true,
          bodyReferenceImageUrl: true,
          morphology: true,
          height: true,
          bodyType: true,
          skinTone: true,
          hairStyle: true,
          fashionStyle: true,
          toneOfVoice: true,
          targetAudience: true,
          preferredCategories: true,
          promptContext: true,
          isAiDisclosed: true,
          platformAccounts: {
            select: {
              platform: true,
              handle: true,
              connectionStatus: true,
            },
          },
        },
      })
    : null;
  const isUpdateMode = Boolean(initialInfluencer);

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[18%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <header className="mb-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
              <Sparkles size={13} />
              Agent creation
            </div>
            <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
              {isUpdateMode ? "Edit" : "New"} <br />
              Muse
            </h1>
          </div>

          <p className="max-w-2xl text-base leading-8 text-stone-500 lg:justify-self-end">
            {isUpdateMode
              ? "Modifie l'identite, la direction artistique et le contexte IA sans casser les connexions sociales existantes."
              : "Cree un influenceur virtuel VioletBeam avec une identite claire, une direction artistique, une morphologie et un contexte IA reutilisable pour les futures generations."}
          </p>
        </header>

        <CreateInfluencerForm initialInfluencer={initialInfluencer} mode={isUpdateMode ? "update" : "create"} />
      </div>
    </main>
  );
}
