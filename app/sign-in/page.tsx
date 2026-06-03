"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { ArrowUpRight, Loader2, LogIn, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getZodFieldErrors, signInSchema } from "@/lib/validations/auth";

type SignInField = "email" | "password";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignInField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: SignInField, values: { email: string; password: string }) => {
    const parsedPayload = signInSchema.safeParse(values);
    const nextErrors = parsedPayload.success ? {} : getZodFieldErrors<SignInField>(parsedPayload.error);

    setFieldErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsedPayload = signInSchema.safeParse({ email, password });
    if (!parsedPayload.success) {
      setFieldErrors(getZodFieldErrors<SignInField>(parsedPayload.error));
      return;
    }

    setIsSubmitting(true);

    let result;

    try {
      result = await signIn("credentials", {
        email: parsedPayload.data.email,
        password: parsedPayload.data.password,
        redirect: false,
      });
    } catch {
      setIsSubmitting(false);
      setError("Connexion impossible pour le moment. Verifiez le domaine utilise et reessayez.");
      return;
    }

    setIsSubmitting(false);

    if (!result) {
      setError("Connexion impossible pour le moment. Reessayez dans quelques instants.");
      return;
    }

    if (result?.error) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setError("Veuillez verifier votre email avant de vous connecter.");
        return;
      }

      setError("Email ou mot de passe incorrect.");
      return;
    }

    const callbackUrl =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("callbackUrl") : null;

    router.push(callbackUrl || "/cabine");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#FDFBFF] text-[#1C1C1C]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] rounded-full bg-[#E6E8FA]/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[30%] rounded-full bg-[#C9A0CD]/10 blur-[100px]" />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8d5f9e]/10 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#8d5f9e]">
            <Sparkles size={13} />
            VioletBeam account
          </div>
          <h1 className="font-serif text-7xl italic leading-[0.85] tracking-tight text-[#1C1C1C] md:text-9xl">
            Sign in
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-stone-500">
            Retrouvez vos compositions, vos looks sauvegardés et vos futurs essayages dans la cabine.
          </p>
          <div className="mt-8 max-w-md overflow-hidden rounded-[34px] border border-white/80 bg-white/55 p-3 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[26px] bg-[#f7f1fb]">
              <img
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=900"
                alt="Editorial fashion silhouette"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/35 to-transparent" />
            </div>
          </div>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-[40px] border border-white/80 bg-gradient-to-br from-[#fbf7ff]/90 via-white/85 to-white/95 p-8 shadow-2xl shadow-purple-900/5 backdrop-blur-2xl"
        >
          <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-[#f7f1fb] text-[#8d5f9e]">
            <LogIn size={22} />
          </div>
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  const nextEmail = event.target.value;
                  setEmail(nextEmail);
                  validateField("email", { email: nextEmail, password });
                }}
                required
                aria-invalid={Boolean(fieldErrors.email)}
                className="h-12 rounded-xl border-stone-200 bg-white"
              />
              {fieldErrors.email && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.email}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  const nextPassword = event.target.value;
                  setPassword(nextPassword);
                  validateField("password", { email, password: nextPassword });
                }}
                required
                maxLength={100}
                aria-invalid={Boolean(fieldErrors.password)}
                className="h-12 rounded-xl border-stone-200 bg-white"
              />
              {fieldErrors.password && <span className="mt-2 block text-xs font-semibold text-red-500">{fieldErrors.password}</span>}
            </label>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 h-12 w-full rounded-full bg-[#1C1C1C] text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-[#8d5f9e]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <ArrowUpRight size={15} />}
            Sign in
          </Button>

          <p className="mt-6 text-center text-sm text-stone-500">
            No account yet?{" "}
            <Link href="/sign-up" className="font-bold text-[#8d5f9e] hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
