"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { allFields, formSchema } from "@/config/formSchema";
import { calculerTrancheAge } from "@/lib/calculs";
import { createClient } from "@/lib/supabase/client";
import type { Fiche } from "@/lib/types";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type ExportField = { key: string; label: string; type: string; options?: string[] };
const columns: ExportField[] = [
  { key: "numero_fiche", label: "N° de fiche", type: "Texte" },
  { key: "date_fiche", label: "Date de la fiche", type: "Date" },
  ...allFields.filter((field) => !field.key.endsWith("_description")).map((field) => ({ key: field.key, label: field.label, type: field.computed ? "Calculé" : field.type, options: field.options })),
];
const coded = (value: unknown, column: ExportField): string | number => {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.map((item) => column.options?.indexOf(String(item)) !== undefined && (column.options?.indexOf(String(item)) ?? -1) >= 0 ? (column.options!.indexOf(String(item)) + 1) : item).join("|");
  if (value === "Oui") return 1;
  if (value === "Non") return 0;
  if (column.options) {
    const index = column.options.indexOf(String(value));
    if (index >= 0) return index + 1;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value);
};

export default function ExportPanel() {
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"clair" | "code">("clair");
  const [scope, setScope] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sex, setSex] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error: queryError } = await createClient().from("fiches").select("*").order("date_fiche", { ascending: true });
        if (queryError) throw queryError;
        if (active) setFiches((data ?? []) as Fiche[]);
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Impossible de charger les fiches."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);
  const currentFilter = useMemo(() => fiches.filter((fiche) => (!from || fiche.date_fiche >= from) && (!to || fiche.date_fiche <= to) && (!sex || fiche.data.sexe === sex)), [fiches, from, to, sex]);
  const selectedFiches = scope === "complete" ? currentFilter.filter((x) => x.statut === "complete") : scope === "filtered" ? currentFilter : fiches;
  const outputValue = (fiche: Fiche, column: ExportField) => {
    const value = column.key === "numero_fiche" ? fiche.numero_fiche : column.key === "date_fiche" ? fiche.date_fiche
      : column.key === "tranche_age" ? (fiche.computed.tranche_age ?? calculerTrancheAge(fiche.data.age))
      : column.type === "Calculé" ? fiche.computed[column.key] : fiche.data[column.key];
    return mode === "code" ? coded(value, column) : Array.isArray(value) ? value.join(", ") : value ?? "";
  };
  const rows = selectedFiches.map((fiche) => Object.fromEntries(columns.map((column) => [column.key, outputValue(fiche, column)])));

  function downloadCsv() {
    const lines = [
      columns.map((column) => `"${column.label.replace(/"/g, '""')}"`).join(";"),
      ...rows.map((row) => columns.map((column) => `"${String(row[column.key] ?? "").replace(/"/g, '""')}"`).join(";")),
    ];
    const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    download(blob, `fiches-chute-${new Date().toISOString().slice(0, 10)}.csv`);
  }
  function downloadExcel() {
    const book = XLSX.utils.book_new();
    const dataSheet = XLSX.utils.json_to_sheet(rows, { header: columns.map((column) => column.key) });
    XLSX.utils.sheet_add_aoa(dataSheet, [columns.map((column) => column.label)], { origin: "A1" });
    XLSX.utils.book_append_sheet(book, dataSheet, "Fiches");
    const dictionary = columns.map((column) => ({
      "Nom de colonne": column.key, "Libellé": column.label, "Type": column.type,
      "Codes": column.options ? column.options.map((option, index) => `${index + 1}=${option}`).join("; ") : column.type === "yesno" ? "1=Oui; 0=Non" : "",
    }));
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(dictionary), "Dictionnaire des variables");
    XLSX.writeFile(book, `fiches-chute-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  if (loading) return <p className="py-16 text-center text-slate-500">Chargement des fiches…</p>;
  return <div className="mx-auto max-w-4xl">
    <p className="text-sm font-semibold uppercase tracking-wide text-forest dark:text-[#8bd1bb]">Données de l’étude</p><h1 className="mt-1 text-3xl font-bold">Export</h1><p className="mt-2 text-slate-500">Export tabulaire, une ligne par fiche et une colonne par variable du schéma.</p>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    <section className="card mt-6 p-5 sm:p-7"><h2 className="text-lg font-bold">Paramètres d’export</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Fiches à exporter<select className="form-control mt-1.5" value={scope} onChange={(e) => setScope(e.target.value)}><option value="all">Toutes les fiches ({fiches.length})</option><option value="complete">Fiches complètes uniquement ({fiches.filter((x) => x.statut === "complete").length})</option><option value="filtered">Résultat du filtre actuel ({currentFilter.length})</option></select></label>
        <label className="text-sm font-medium">Format des valeurs<select className="form-control mt-1.5" value={mode} onChange={(e) => setMode(e.target.value as "clair" | "code")}><option value="clair">Libellés en clair</option><option value="code">Valeurs codées (Oui=1, Non=0, modalités numérotées)</option></select></label>
      </div>
      <fieldset className="mt-5 rounded-xl border p-4 dark:border-slate-700"><legend className="px-2 text-sm font-medium">Filtre actuel (pour l’option « résultat du filtre »)</legend><div className="grid gap-3 sm:grid-cols-3"><label className="text-xs text-slate-500">Du<input type="date" className="form-control mt-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label className="text-xs text-slate-500">Au<input type="date" className="form-control mt-1" value={to} onChange={(e) => setTo(e.target.value)} /></label><label className="text-xs text-slate-500">Sexe<select className="form-control mt-1" value={sex} onChange={(e) => setSex(e.target.value)}><option value="">Tous</option><option>Masculin</option><option>Féminin</option></select></label></div></fieldset>
      <p className="mt-4 text-sm text-slate-500">{selectedFiches.length} fiche(s) sélectionnée(s) · {columns.length} variables.</p>
      <div className="mt-5 flex flex-wrap gap-3"><button onClick={downloadCsv} disabled={!selectedFiches.length} className="touch-button rounded-xl bg-forest px-5 py-3 font-semibold text-white disabled:opacity-40">⇩ Télécharger CSV</button><button onClick={downloadExcel} disabled={!selectedFiches.length} className="touch-button rounded-xl border px-5 py-3 font-semibold disabled:opacity-40">⇩ Télécharger Excel (.xlsx)</button></div>
      <div className="mt-6 rounded-lg bg-sand p-4 text-sm text-slate-600 dark:bg-[#101b1a] dark:text-slate-300"><p><strong>CSV :</strong> séparateur point-virgule, encodage UTF-8 avec BOM pour Excel français.</p><p className="mt-1"><strong>Excel :</strong> inclut une feuille « Dictionnaire des variables » avec les modalités codées.</p></div>
    </section>
  </div>;
}
