"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";

const links = [
  { href: "/fiches", label: "Fiches", icon: "▤" },
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: "◷" },
  { href: "/export", label: "Export", icon: "⇩" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dark, toggle } = useTheme();
  async function logout() {
    try { await createClient().auth.signOut(); router.push("/login"); router.refresh(); }
    catch (error) { window.alert(error instanceof Error ? error.message : "La déconnexion a échoué."); }
  }
  return (
    <div className="min-h-screen bg-sand text-ink transition-colors dark:bg-[#101b1a] dark:text-[#e8f0ed]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#142321]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/fiches" className="flex items-center gap-3" aria-label="Fiche Chute, accueil">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-xl font-bold text-white">FC</span>
            <span><strong className="block leading-tight">Fiche Chute</strong><small className="text-xs text-slate-500 dark:text-slate-400">CHU d’Angré · 2026</small></span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="touch-button rounded-lg border px-3 py-2 text-sm" aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}>{dark ? "☀ Clair" : "☾ Sombre"}</button>
            <button onClick={logout} className="hidden rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-black/5 dark:hover:bg-white/10 sm:block">Déconnexion</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Navigation principale">
          {links.map((link) => <Link key={link.href} href={link.href} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${pathname.startsWith(link.href) ? "border-forest text-forest dark:text-[#8bd1bb]" : "border-transparent text-slate-500 hover:text-ink dark:text-slate-400 dark:hover:text-white"}`}><span className="mr-2">{link.icon}</span>{link.label}</Link>)}
          <button onClick={logout} className="ml-auto whitespace-nowrap px-4 py-3 text-sm text-slate-500 sm:hidden">Quitter</button>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-500">Données anonymisées · Étude sur le risque de chute chez la personne âgée</footer>
    </div>
  );
}
