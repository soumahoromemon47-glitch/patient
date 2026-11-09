export const SEUIL_RISQUE_ELEVE = 5;
export const SEUIL_RISQUE_FAIBLE = 30;

export type Reponses = Record<string, unknown>;

const nombre = (value: unknown): number | undefined => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function calculerImc(poids?: unknown, taille?: unknown): number | null {
  const p = nombre(poids);
  const t = nombre(taille);
  if (!p || !t || p <= 0 || t <= 0) return null;
  return Math.round((p / (t * t)) * 10) / 10;
}

export function categorieImc(imc: number): string {
  if (imc < 18.5) return "Maigreur";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Surpoids";
  return "Obésité";
}

export function calculerPam(pas?: unknown, pad?: unknown): number | null {
  const systolique = nombre(pas);
  const diastolique = nombre(pad);
  if (systolique === undefined || diastolique === undefined) return null;
  return Math.round((systolique + 2 * diastolique) / 3);
}

export function calculerHypotensionOrthostatique(reponses: Reponses) {
  const pasAssis = nombre(reponses.pa_assis_sys);
  const padAssis = nombre(reponses.pa_assis_dia);
  const pasDebout = nombre(reponses.pa_debout_sys);
  const padDebout = nombre(reponses.pa_debout_dia);
  if ([pasAssis, padAssis, pasDebout, padDebout].some((value) => value === undefined)) {
    return { presente: null, baissePas: null, baissePad: null };
  }
  const baissePas = pasAssis! - pasDebout!;
  const baissePad = padAssis! - padDebout!;
  return { presente: baissePas >= 20 || baissePad >= 10, baissePas, baissePad };
}

export function calculerPolymedication(nombreMedicaments?: unknown): boolean | null {
  const count = nombre(nombreMedicaments);
  return count === undefined ? null : count >= 5;
}

export function calculerNiveauRisque(secondes?: unknown): string | null {
  const duration = nombre(secondes);
  if (duration === undefined || duration < 0) return null;
  if (duration < SEUIL_RISQUE_ELEVE) return "Risque de chute élevé";
  if (duration <= SEUIL_RISQUE_FAIBLE) return "Risque modéré";
  return "Risque faible";
}

export function calculerTrancheAge(age?: unknown): string | null {
  const value = nombre(age);
  if (value === undefined || value < 60) return null;
  if (value < 70) return "60-69";
  if (value < 80) return "70-79";
  if (value < 90) return "80-89";
  return "90+";
}

export function calculerValeurs(reponses: Reponses): Record<string, unknown> {
  const hypotension = calculerHypotensionOrthostatique(reponses);
  return {
    imc: calculerImc(reponses.poids, reponses.taille),
    pam_assis: calculerPam(reponses.pa_assis_sys, reponses.pa_assis_dia),
    hypotension_orthostatique_calculee: hypotension.presente === null ? null : hypotension.presente ? "Oui" : "Non",
    baisse_pas: hypotension.baissePas,
    baisse_pad: hypotension.baissePad,
    polymedication: calculerPolymedication(reponses.nb_medicaments) === null ? null : calculerPolymedication(reponses.nb_medicaments) ? "Oui" : "Non",
    niveau_risque: calculerNiveauRisque(reponses.unipodal_secondes),
    tranche_age: calculerTrancheAge(reponses.age),
  };
}
