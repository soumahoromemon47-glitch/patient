"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dataFields, formSchema, isFieldVisible } from "@/config/formSchema";
import { calculerValeurs, categorieImc } from "@/lib/calculs";
import { ficheSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import type { Fiche } from "@/lib/types";
import Link from "next/link";

type Values = Record<string, unknown> & { numero_fiche: string; date_fiche: string };

function todayLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function showValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
}

export default function FicheForm({ fiche }: { fiche?: Fiche }) {
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(ficheSchema),
    defaultValues: {
      numero_fiche: fiche?.numero_fiche ?? "",
      date_fiche: fiche?.date_fiche ?? todayLocal(),
      ...(fiche?.data ?? {}),
    },
    mode: "onBlur",
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(fiche?.statut ?? "brouillon");
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState(fiche?.id);
  const [lastSaved, setLastSaved] = useState("");
  const savingRef = useRef(false);
  const current = watch();
  const computed = useMemo(() => calculerValeurs(current), [current]);
  const totalSteps = formSchema.length + 1;
  const visibleFields = formSchema[step]?.fields ?? [];
  const save = useCallback(async (nextStatus: "brouillon" | "complete" = status): Promise<string | false> => {
    if (savingRef.current) return false;
    const values = getValues();
    if (!String(values.numero_fiche ?? "").trim()) {
      setError("Saisissez le numéro de fiche avant de sauvegarder.");
      return false;
    }
    savingRef.current = true; setSaving(true); setError("");
    try {
      const { numero_fiche, date_fiche } = values;
      const data = Object.fromEntries(dataFields
        .filter((field) => isFieldVisible(field, values) && values[field.key] !== undefined && values[field.key] !== "")
        .map((field) => [field.key, values[field.key]]));
      const client = createClient();
      const record = {
        numero_fiche: String(numero_fiche).trim(),
        date_fiche: String(date_fiche || todayLocal()),
        statut: nextStatus,
        data,
        computed: calculerValeurs(data),
      };
      const query = savedId
        ? client.from("fiches").update(record).eq("id", savedId).select("id").single()
        : client.from("fiches").insert(record).select("id").single();
      const { data: result, error: saveError } = await query;
      if (saveError) {
        if (saveError.code === "23505") throw new Error("Ce numéro de fiche existe déjà. Choisissez un numéro unique.");
        throw saveError;
      }
      if (!result?.id) throw new Error("La fiche a été sauvegardée sans identifiant retourné.");
      setSavedId(result.id); setStatus(nextStatus); setLastSaved(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      return result.id;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La sauvegarde a échoué.");
      return false;
    } finally { savingRef.current = false; setSaving(false); }
  }, [getValues, savedId, status]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (String(getValues("numero_fiche") ?? "").trim()) void save();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [getValues, save]);

  async function changeStep(next: number) {
    if (savedId || String(getValues("numero_fiche") ?? "").trim()) await save();
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish() {
    await handleSubmit(async () => {
      const id = await save("complete");
      if (id) window.location.assign(`/fiches/${id}`);
    }, (formErrors) => {
      setError("Vérifiez le champ signalé à l’étape affichée avant de terminer.");
      const invalidStep = formSchema.findIndex((section) =>
        section.fields.some((field) => Boolean(formErrors[field.key])),
      );
      if (invalidStep >= 0) setStep(invalidStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    })();
  }

  function renderField(field: (typeof formSchema)[number]["fields"][number]) {
    if (field.type === "computed" && field.key.endsWith("_description")) {
      return <div key={field.key} className="col-span-full border-b pb-2 pt-3 text-sm font-bold uppercase tracking-wide text-forest dark:text-[#8bd1bb]">{field.label}</div>;
    }
    if (!isFieldVisible(field, current)) return null;
    const calculated = computed[field.key];
    if (field.computed) {
      let output = showValue(calculated);
      if (field.key === "imc" && typeof calculated === "number") output += ` · ${categorieImc(calculated)}${calculated < 21 ? " · Alerte : IMC < 21, risque de dénutrition" : ""}`;
      if (field.key === "baisse_pas" || field.key === "baisse_pad") {
        if (calculated !== null && calculated !== undefined) output += ` ${field.unit ?? ""}`;
      }
      return <div key={field.key} className="rounded-xl border border-forest/20 bg-mint/50 p-4 dark:bg-forest/20"><p className="text-sm text-slate-600 dark:text-slate-300">{field.label}</p><p className="mt-1 font-semibold">{output}</p><input type="hidden" {...register(field.key)} value={calculated === null || calculated === undefined ? "" : String(calculated)} /></div>;
    }
    const errorText = (errors[field.key]?.message as string | undefined);
    return <div key={field.key} className={field.type === "multi" ? "col-span-full" : ""}>
      <label className="mb-1.5 block text-sm font-medium" htmlFor={field.key}>{field.label}{field.unit ? <span className="ml-1 text-slate-500">({field.unit})</span> : null}</label>
      {field.type === "yesno" ? <div className="grid grid-cols-2 gap-3">
        {["Oui", "Non"].map((option) => <label key={option} className={`flex min-h-14 cursor-pointer items-center justify-center rounded-xl border-2 font-semibold transition ${current[field.key] === option ? "border-forest bg-mint text-forest dark:bg-forest/30 dark:text-white" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#192a26]"}`}><input className="sr-only" type="radio" value={option} {...register(field.key)} />{option}</label>)}
      </div> : field.type === "single" ? <select id={field.key} className="form-control" {...register(field.key)}><option value="">Sélectionner…</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
      : field.type === "multi" ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{field.options?.map((option) => {
        const selected = (current[field.key] as string[] | undefined) ?? [];
        return <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${selected.includes(option) ? "border-forest bg-mint/60 dark:bg-forest/20" : "border-slate-200 dark:border-slate-700"}`}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => {
          const next = event.target.checked ? [...selected, option] : selected.filter((item) => item !== option);
          setValue(field.key, next, { shouldDirty: true });
        }} />{option}</label>;
      })}</div>
      : <input id={field.key} className="form-control" type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} step={field.type === "number" ? "any" : undefined} min={field.min} max={field.max} {...register(field.key, field.type === "number" ? { setValueAs: (value: string) => value === "" ? undefined : Number(value) } : {})} />}
      {field.hint && <p className="mt-1 text-xs text-slate-500">{field.hint}</p>}
      {errorText && <p role="alert" className="mt-1 text-xs text-red-600">{errorText}</p>}
    </div>;
  }

  const formError = errors.numero_fiche?.message as string | undefined;
  return <div className="mx-auto max-w-4xl">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div><Link href={fiche ? `/fiches/${fiche.id}` : "/fiches"} className="text-sm text-forest hover:underline dark:text-[#8bd1bb]">← Retour</Link><h1 className="mt-2 text-2xl font-bold">{fiche ? "Modifier la fiche" : "Nouvelle fiche"}</h1></div>
      <div className="text-right text-sm text-slate-500"><span className={`inline-flex rounded-full px-3 py-1 ${status === "complete" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{status}</span><p className="mt-1">{saving ? "Sauvegarde…" : lastSaved ? `Enregistrée à ${lastSaved}` : "Sauvegarde automatique"}</p></div>
    </div>
    <section className="card mb-5 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4 text-sm"><span className="font-semibold">Identification anonyme</span><span className="text-slate-500">Étape {Math.min(step + 1, totalSteps)} / {totalSteps}</span></div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-forest transition-all" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1.5 block text-sm font-medium" htmlFor="numero_fiche">N° de fiche *</label><input id="numero_fiche" className="form-control" {...register("numero_fiche")} /><p className="mt-1 text-xs text-slate-500">Ne saisissez aucune donnée nominative.</p>{formError && <p role="alert" className="text-xs text-red-600">{formError}</p>}</div>
        <div><label className="mb-1.5 block text-sm font-medium" htmlFor="date_fiche">Date *</label><input id="date_fiche" type="date" className="form-control" {...register("date_fiche")} />{errors.date_fiche?.message && <p role="alert" className="text-xs text-red-600">{String(errors.date_fiche.message)}</p>}</div>
      </div>
    </section>
    {step < formSchema.length ? <section className="card p-5 sm:p-8">
      <h2 className="text-xl font-bold">{formSchema[step].title}</h2>
      {formSchema[step].description && <p className="mt-2 rounded-lg bg-mint/50 p-3 text-sm text-forest dark:bg-forest/20 dark:text-[#b8e4d4]">{formSchema[step].description}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{visibleFields.map((field) => renderField(field))}</div>
      <div className="mt-8 flex justify-between gap-3"><button type="button" disabled={step === 0} onClick={() => void changeStep(step - 1)} className="touch-button rounded-xl border px-5 py-3 disabled:opacity-40">← Précédent</button><button type="button" onClick={() => void changeStep(step + 1)} className="touch-button rounded-xl bg-forest px-6 py-3 font-semibold text-white">Suivant →</button></div>
    </section> : <section className="card p-5 sm:p-8">
      <h2 className="text-xl font-bold">Récapitulatif de la fiche</h2><p className="mt-1 text-sm text-slate-500">Vérifiez les informations avant de valider.</p>
      {formSchema.map((section) => <div key={section.key} className="mt-6"><h3 className="border-b pb-2 font-semibold">{section.title}</h3><dl className="grid gap-x-6 sm:grid-cols-2">{section.fields.filter((field) => !field.key.endsWith("_description") && isFieldVisible(field, current)).map((field) => <div key={field.key} className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm dark:border-slate-700"><dt className="text-slate-500">{field.label}</dt><dd className="text-right font-medium">{showValue(field.computed ? computed[field.key] : current[field.key])}</dd></div>)}</dl></div>)}
      <div className="mt-8 flex flex-wrap justify-between gap-3"><button onClick={() => void changeStep(step - 1)} className="touch-button rounded-xl border px-5 py-3">← Précédent</button><button onClick={() => void finish()} disabled={saving} className="touch-button rounded-xl bg-forest px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Validation…" : "Terminer la fiche"}</button></div>
    </section>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
    <button onClick={() => void save()} disabled={saving} className="mt-4 text-sm text-slate-500 underline">Enregistrer le brouillon maintenant</button>
  </div>;
}
