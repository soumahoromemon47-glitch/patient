import Link from "next/link";
import { notFound } from "next/navigation";
import { formSchema, isFieldVisible } from "@/config/formSchema";
import { createClient } from "@/lib/supabase/server";
import type { Fiche } from "@/lib/types";
import PdfDownloadButton from "@/components/PdfDownloadButton";
import DeleteFicheButton from "@/components/DeleteFicheButton";

const showValue = (value: unknown) => Array.isArray(value) ? value.join(", ") || "—" : value === null || value === undefined || value === "" ? "—" : typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value);

export default async function FicheDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fiches").select("*").eq("id", params.id).single();
  if (error || !data) notFound();
  const fiche = data as Fiche;
  return <div className="mx-auto max-w-4xl">
    <Link href="/fiches" className="text-sm text-forest hover:underline dark:text-[#8bd1bb]">← Retour aux fiches</Link>
    <div className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Fiche {fiche.numero_fiche}</h1><p className="mt-1 text-slate-500">Date : {fiche.date_fiche} · {fiche.statut === "complete" ? "Complète" : "Brouillon"}</p></div><div className="flex flex-wrap gap-2"><PdfDownloadButton fiche={fiche} /><Link href={`/fiches/${fiche.id}/modifier`} className="touch-button rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white">Modifier</Link><DeleteFicheButton id={fiche.id} /></div></div>
    {formSchema.map((section) => <section key={section.key} className="card mb-4 p-5"><h2 className="text-lg font-bold">{section.title}</h2><dl className="mt-3 grid gap-x-8 sm:grid-cols-2">{section.fields.filter((field) => !field.key.endsWith("_description") && isFieldVisible(field, fiche.data)).map((field) => <div key={field.key} className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm dark:border-slate-700"><dt className="text-slate-500">{field.label}{field.unit ? ` (${field.unit})` : ""}</dt><dd className="text-right font-medium">{showValue(field.computed ? fiche.computed[field.key] : fiche.data[field.key])}</dd></div>)}</dl></section>)}
  </div>;
}
