"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formSchema } from "@/config/formSchema";
import { calculerTrancheAge } from "@/lib/calculs";
import { createClient } from "@/lib/supabase/client";
import type { Fiche } from "@/lib/types";

const colors = ["#23665d", "#73b89f", "#e7ae54", "#bc6d5f", "#9aa9a2"];
const countBy = (values: (string | null | undefined)[]) => values.reduce<Record<string, number>>((acc, value) => {
  if (value) acc[value] = (acc[value] ?? 0) + 1;
  return acc;
}, {});
const chartRows = (counts: Record<string, number>) => Object.entries(counts).map(([name, value]) => ({ name, value }));

export default function Dashboard() {
  const [all, setAll] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState(["troubles_marche", "aide_technique", "polymedication", "hypotension_orthostatique_calculee"]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error: queryError } = await createClient().from("fiches").select("*").eq("statut", "complete");
        if (queryError) throw queryError;
        if (active) setAll((data ?? []) as Fiche[]);
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Impossible de charger les données."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  const fiches = useMemo(() => all.filter((fiche) => (!from || fiche.date_fiche >= from) && (!to || fiche.date_fiche <= to)), [all, from, to]);
  const total = fiches.length;
  const avgAge = total ? fiches.reduce((sum, fiche) => sum + (Number(fiche.data.age) || 0), 0) / fiches.filter((fiche) => Number(fiche.data.age) > 0).length : 0;
  const percent = (count: number) => total ? Math.round((count / total) * 100) : 0;
  const falls = countBy(fiches.map((fiche) => String(fiche.data.chute_12m ?? "")));
  const cards = [
    ["Fiches complètes", String(total), "Dossiers validés"],
    ["Âge moyen", total && Number.isFinite(avgAge) ? `${avgAge.toFixed(1)} ans` : "—", "Parmi les âges renseignés"],
    ["Chute dans les 12 mois", `${percent(falls.Oui ?? 0)} %`, `${falls.Oui ?? 0} patient(e)s`],
    ["Polymédication", `${percent(fiches.filter((x) => x.computed.polymedication === "Oui").length)} %`, "≥ 5 médicaments"],
    ["Hypotension orthostatique", `${percent(fiches.filter((x) => x.computed.hypotension_orthostatique_calculee === "Oui").length)} %`, "Calculée selon les seuils"],
  ];
  const ageRows = chartRows(countBy(fiches.map((x) => calculerTrancheAge(x.data.age))));
  const sexRows = chartRows(countBy(fiches.map((x) => String(x.data.sexe ?? ""))));
  const riskRows = chartRows(countBy(fiches.map((x) => String(x.computed.niveau_risque ?? ""))));
  const momentRows = chartRows(countBy(fiches.filter((x) => x.data.chute_12m === "Oui").map((x) => String(x.data.moment_chute ?? ""))));
  const residenceRows = chartRows(countBy(fiches.map((x) => String(x.data.vit_a_domicile ?? ""))));
  const booleanFactors = formSchema.flatMap((section) => section.fields).filter((field) => field.type === "yesno");
  const frequencyRows = booleanFactors.map((field) => ({
    name: field.label,
    value: total ? Math.round((fiches.filter((fiche) => fiche.data[field.key] === "Oui").length / total) * 100) : 0,
  })).filter((row) => row.value > 0).sort((a, b) => b.value - a.value).slice(0, 12);
  const factorOptions = [
    ...booleanFactors.map(({ key, label }) => ({ key, label, getter: (fiche: Fiche) => fiche.data[key] === "Oui" })),
    { key: "polymedication", label: "Polymédication", getter: (fiche: Fiche) => fiche.computed.polymedication === "Oui" },
    { key: "hypotension_orthostatique_calculee", label: "Hypotension orthostatique", getter: (fiche: Fiche) => fiche.computed.hypotension_orthostatique_calculee === "Oui" },
  ];
  const crossRows = selected.map((key) => {
    const factor = factorOptions.find((option) => option.key === key)!;
    const exposed = fiches.filter(factor.getter);
    const exposedFalls = exposed.filter((fiche) => fiche.data.chute_12m === "Oui").length;
    return { label: factor.label, oui: exposed.length, ouiFalls: exposedFalls, ouiRate: exposed.length ? Math.round(exposedFalls / exposed.length * 100) : 0, non: total - exposed.length, nonFalls: fiches.filter((fiche) => !factor.getter(fiche) && fiche.data.chute_12m === "Oui").length };
  });
  const toggleFactor = (key: string) => setSelected((value) => value.includes(key) ? value.filter((x) => x !== key) : value.length < 5 ? [...value, key] : value);

  if (loading) return <p className="py-16 text-center text-slate-500">Chargement du tableau de bord…</p>;
  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-forest dark:text-[#8bd1bb]">Analyse descriptive</p><h1 className="mt-1 text-3xl font-bold">Tableau de bord</h1><p className="mt-1 text-sm text-slate-500">Seules les fiches complètes sont incluses.</p></div><div className="flex gap-2"><label className="text-xs text-slate-500">Du<input type="date" className="form-control mt-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label className="text-xs text-slate-500">Au<input type="date" className="form-control mt-1" value={to} onChange={(e) => setTo(e.target.value)} /></label></div></div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label, value, note]) => <section key={label} className="card p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></section>)}</div>
    {!total ? <section className="card p-10 text-center text-slate-500">Aucune fiche complète sur la période sélectionnée.</section> : <>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Répartition par sexe" rows={sexRows} colors={colors} />
        <ChartCard title="Répartition par tranche d’âge" rows={ageRows} colors={colors} />
        <ChartCard title="Risque (station unipodale)" rows={riskRows} colors={colors} />
        <ChartCard title="Chute dans les 12 derniers mois" rows={chartRows(falls)} colors={colors} />
        <ChartCard title="Moment de la chute" rows={momentRows} colors={colors} />
        <ChartCard title="Lieu de vie" rows={residenceRows} colors={colors} />
      </div>
      <section className="card mt-4 p-5"><h2 className="font-bold">Fréquence des facteurs de risque et antécédents</h2><p className="mb-3 text-xs text-slate-500">Pourcentage de fiches complètes avec facteur présent.</p><div className="h-[390px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={frequencyRows} layout="vertical" margin={{ left: 10, right: 25 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="name" width={175} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, "Fréquence"]} /><Bar dataKey="value" fill="#418977" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="card mt-4 p-5"><h2 className="font-bold">Chutes × facteurs de risque</h2><p className="mt-1 text-xs text-slate-500">Sélectionnez jusqu’à 5 facteurs à comparer.</p><div className="my-4 flex flex-wrap gap-2">{factorOptions.map((factor) => <button key={factor.key} onClick={() => toggleFactor(factor.key)} className={`rounded-full border px-3 py-1.5 text-xs ${selected.includes(factor.key) ? "border-forest bg-mint text-forest dark:bg-forest/30 dark:text-white" : "border-slate-200 text-slate-500 dark:border-slate-700"}`}>{factor.label}</button>)}</div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="py-2">Facteur présent</th><th>Avec facteur n</th><th>Chute n</th><th>Chute % parmi avec facteur</th><th>Sans facteur n</th><th>Chute sans facteur n</th></tr></thead><tbody>{crossRows.map((row) => <tr key={row.label} className="border-b border-slate-100 dark:border-slate-700"><td className="py-3 font-medium">{row.label}</td><td>{row.oui}</td><td>{row.ouiFalls}</td><td>{row.ouiRate} %</td><td>{row.non}</td><td>{row.nonFalls}</td></tr>)}</tbody></table></div></section>
    </>}
  </div>;
}

function ChartCard({ title, rows, colors: palette }: { title: string; rows: { name: string; value: number }[]; colors: string[] }) {
  return <section className="card p-5"><h2 className="font-bold">{title}</h2><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>{rows.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">{rows.map((row, index) => <span key={row.name}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />{row.name} ({row.value})</span>)}</div></section>;
}
