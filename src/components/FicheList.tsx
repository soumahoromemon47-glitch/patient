"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculerTrancheAge } from "@/lib/calculs";
import type { Fiche } from "@/lib/types";

const pageSize = 15;
const display = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);

export default function FicheList() {
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sex, setSex] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [falls, setFalls] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        const { data, error: queryError } = await createClient().from("fiches").select("*").order("date_fiche", { ascending: false });
        if (queryError) throw queryError;
        if (active) setFiches((data ?? []) as Fiche[]);
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Impossible de charger les fiches."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => fiches.filter((fiche) => {
    const age = Number(fiche.data.age);
    return (!search || fiche.numero_fiche.toLowerCase().includes(search.toLowerCase()))
      && (!from || fiche.date_fiche >= from) && (!to || fiche.date_fiche <= to)
      && (!sex || fiche.data.sexe === sex)
      && (!ageRange || calculerTrancheAge(age) === ageRange)
      && (!falls || fiche.data.chute_12m === falls)
      && (!risk || fiche.computed.niveau_risque === risk)
      && (!status || fiche.statut === status);
  }), [fiches, search, from, to, sex, ageRange, falls, risk, status]);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const reset = () => { setSearch(""); setFrom(""); setTo(""); setSex(""); setAgeRange(""); setFalls(""); setRisk(""); setStatus(""); setPage(0); };

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-forest dark:text-[#8bd1bb]">Registre d’étude</p><h1 className="mt-1 text-3xl font-bold">Fiches d’enquête</h1><p className="mt-1 text-slate-500">{filtered.length} fiche{filtered.length > 1 ? "s" : ""}</p></div><Link href="/fiches/nouvelle" className="touch-button rounded-xl bg-forest px-5 py-3 font-semibold text-white hover:bg-[#1a554c]">＋ Nouvelle fiche</Link></div>
    <section className="card mb-5 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-slate-500">Recherche n° fiche<input className="form-control mt-1 text-sm" placeholder="Ex. FC-001" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></label>
        <label className="text-xs font-medium text-slate-500">Date de début<input type="date" className="form-control mt-1 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs font-medium text-slate-500">Date de fin<input type="date" className="form-control mt-1 text-sm" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label className="text-xs font-medium text-slate-500">Sexe<select className="form-control mt-1 text-sm" value={sex} onChange={(e) => setSex(e.target.value)}><option value="">Tous</option><option>Masculin</option><option>Féminin</option></select></label>
        <label className="text-xs font-medium text-slate-500">Tranche d’âge<select className="form-control mt-1 text-sm" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}><option value="">Toutes</option>{["60-69", "70-79", "80-89", "90+"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-500">Chute dans les 12 mois<select className="form-control mt-1 text-sm" value={falls} onChange={(e) => setFalls(e.target.value)}><option value="">Toutes</option><option>Oui</option><option>Non</option></select></label>
        <label className="text-xs font-medium text-slate-500">Niveau de risque<select className="form-control mt-1 text-sm" value={risk} onChange={(e) => setRisk(e.target.value)}><option value="">Tous</option>{["Risque de chute élevé", "Risque modéré", "Risque faible"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-500">Statut<select className="form-control mt-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Tous</option><option value="complete">Complète</option><option value="brouillon">Brouillon</option></select></label>
      </div>
      <button onClick={reset} className="mt-3 text-sm text-forest underline dark:text-[#8bd1bb]">Effacer les filtres</button>
    </section>
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    <section className="card overflow-hidden">
      {loading ? <p className="p-8 text-center text-slate-500">Chargement des fiches…</p> : filtered.length === 0 ? <div className="p-10 text-center"><p className="font-semibold">Aucune fiche trouvée</p><p className="mt-1 text-sm text-slate-500">Modifiez vos filtres ou créez une nouvelle fiche.</p></div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-[#1c302c]"><tr>{["N° fiche", "Date", "Âge", "Sexe", "Chute 12 mois", "Niveau de risque", "Statut"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{paged.map((fiche) => <tr key={fiche.id} tabIndex={0} role="link" aria-label={`Ouvrir la fiche ${fiche.numero_fiche}`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") window.location.assign(`/fiches/${fiche.id}`); }} onClick={() => window.location.assign(`/fiches/${fiche.id}`)} className="cursor-pointer hover:bg-mint/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest dark:hover:bg-forest/10"><td className="px-4 py-4 font-semibold text-forest dark:text-[#8bd1bb]">{fiche.numero_fiche}</td><td className="px-4 py-4">{fiche.date_fiche}</td><td className="px-4 py-4">{display(fiche.data.age)}</td><td className="px-4 py-4">{display(fiche.data.sexe)}</td><td className="px-4 py-4">{display(fiche.data.chute_12m)}</td><td className="px-4 py-4">{display(fiche.computed.niveau_risque)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${fiche.statut === "complete" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{fiche.statut === "complete" ? "Complète" : "Brouillon"}</span></td></tr>)}</tbody></table></div>}
      {filtered.length > pageSize && <div className="flex items-center justify-between border-t px-4 py-3 text-sm"><span>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} sur {filtered.length}</span><div className="flex gap-2"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Précédent</button><button disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Suivant</button></div></div>}
    </section>
  </div>;
}
