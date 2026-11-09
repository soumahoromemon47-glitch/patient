"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: authError } = await createClient().auth.signInWithPassword(
        { email, password },
      );
      if (authError) throw authError;
      router.replace("/fiches");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Connexion impossible.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-4 py-10 dark:bg-[#101b1a]">
      <button
        onClick={toggle}
        className="absolute right-4 top-4 rounded-lg border px-3 py-2 text-sm"
      >
        {dark ? "☀ Mode clair" : "☾ Mode sombre"}
      </button>
      <section className="card w-full max-w-md p-7 sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-forest text-xl font-bold text-white">
            FC
          </div>
          <h1 className="text-2xl font-bold">Fiche Chute</h1>
          <p className="mt-1 text-sm text-slate-500">
            CHU d’Angré · Étude 2026
          </p>
        </div>
        <h2 className="mb-5 text-lg font-semibold">Connexion médecin</h2>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            Adresse e-mail
            <input
              className="form-control mt-1.5"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Mot de passe
            <input
              className="form-control mt-1.5"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="touch-button w-full rounded-xl bg-forest px-4 py-3 font-semibold text-white hover:bg-[#1a554c] disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-slate-500">
          Accès réservé à l’utilisatrice autorisée.
        </p>
      </section>
    </main>
  );
}
