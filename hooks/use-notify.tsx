import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const useNotify = () => {
  const router = useRouter();
  
  const notifyError = (status: number, message?: string) => {
    switch (status) {
      
      case 401:
        return toast.error("Connexion requise", {
          description: "Veuillez vous connecter pour continuer.",
          action: {
            label: "Se connecter",
            onClick: () => router.push("/signin"),
          },
        });

      case 402:
        return toast.warning("Crédits insuffisants", {
          description: message || "Besoin de Cyber-Cells pour cette action.",
          action: {
            label: "Boutique",
            onClick: () => router.push("/billing"),
          },
        });

      case 403:
        return toast.error("Accès refusé", {
          description: "Vous n'avez pas les droits ou le niveau requis.",
        });

      case 429:
        return toast.info("Doucement !", {
          description: "Veuillez patienter avant la prochaine tentative.",
        });

      default:
        return toast.error("Erreur inattendue", {
          description: message || "Une erreur est survenue sur le serveur.",
        });
    }
  };

  const notifySuccess = (title: string, imageUrl?: string) => {
    if (imageUrl) {
      // Version avec image (pour tes générations réussies)
      return toast.custom((t) => (
        <div className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl text-white">
          <img src={imageUrl} alt="preview" className="w-12 h-12 rounded-md object-cover border border-cyan-500" />
          <div className="flex flex-col">
            <span className="font-bold text-sm text-cyan-400">{title}</span>
            <span className="text-xs text-slate-400">Prêt pour le prochain défi ?</span>
          </div>
          <button onClick={() => toast.dismiss(t)} className="ml-auto text-slate-500">✕</button>
        </div>
      ));
    }
    
    return toast.success(title);
  };

  return { notifyError, notifySuccess };
};
