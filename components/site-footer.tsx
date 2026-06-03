import Link from "next/link";
import { Images, Layers, Mail, ShieldCheck, Shirt, Sparkles, Store, WandSparkles } from "lucide-react";

const productLinks = [
  { href: "/cabine", label: "Cabine", icon: WandSparkles },
  { href: "/catalog", label: "Catalog", icon: Shirt },
  { href: "/categories", label: "Categories", icon: Layers },
  { href: "/brands", label: "Brands", icon: Store },
  { href: "/lookbook", label: "Lookbook", icon: Images },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/70 bg-white/65 px-6 py-10 shadow-[0_-18px_60px_-50px_rgba(92,54,118,0.45)] backdrop-blur-2xl lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
        <div>
          <Link href="/" className="group inline-flex items-center gap-3 rounded-lg transition-colors">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#1C1C1C] text-white shadow-sm transition-colors group-hover:bg-[#8d5f9e]">
              <Sparkles size={17} />
            </span>
            <span className="font-serif text-3xl italic leading-none text-[#1C1C1C]">VioletBeam</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-stone-500">
            Essayage virtuel, catalogue mode et lookbook génératif pour découvrir, composer et visualiser des styles avant l’achat.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Product</h2>
          <div className="space-y-2">
            {productLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-9 items-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 transition-colors hover:bg-white/65 hover:px-3 hover:text-[#8d5f9e]"
                >
                  <Icon size={13} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Company</h2>
          <div className="space-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex h-9 items-center rounded-lg text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 transition-colors hover:bg-white/65 hover:px-3 hover:text-[#8d5f9e]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#8d5f9e]">Contact</h2>
          <div className="space-y-3">
            <a
              href="mailto:joseph.d@violetbeam.com"
              className="flex items-center gap-3 rounded-lg bg-white/55 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500 ring-1 ring-white/70 transition-colors hover:text-[#8d5f9e]"
            >
              <Mail size={14} />
              joseph.d@violetbeam.com
            </a>
            <div className="flex items-center gap-3 rounded-lg bg-[#f7f1fb]/80 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#8d5f9e]">
              <ShieldCheck size={14} />
              Beta fashion AI
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t border-stone-200/70 pt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400 md:flex-row">
        <span>© {new Date().getFullYear()} VioletBeam Studio</span>
        <span>Paris / Bruxelles</span>
      </div>
    </footer>
  );
}
