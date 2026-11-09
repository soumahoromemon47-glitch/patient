import { z } from "zod";
import { dataFields } from "@/config/formSchema";

const fieldRules = Object.fromEntries(dataFields.map((field) => {
  if (field.type === "number") {
    const numberRule = z.number().optional().refine(
      (value) => value === undefined
        || ((field.min === undefined || value >= field.min) && (field.max === undefined || value <= field.max)),
      `${field.label} doit être compris entre ${field.min ?? "la valeur minimale"} et ${field.max ?? "la valeur maximale"}.`,
    );
    return [field.key, z.preprocess((value) => value === "" || value === null ? undefined : typeof value === "number" ? value : Number(value), numberRule)];
  }
  if (field.type === "single" || field.type === "yesno") {
    const options = field.options ?? [];
    return [field.key, z.preprocess(
      (value) => value === "" ? undefined : value,
      options.length ? z.enum(options as [string, ...string[]]).optional() : z.string().optional(),
    )];
  }
  if (field.type === "multi") return [field.key, z.array(z.string()).optional()];
  return [field.key, z.string().optional()];
}));

export const ficheSchema = z.object({
  numero_fiche: z.string().trim().min(1, "Le numéro de fiche est obligatoire."),
  date_fiche: z.string().min(1, "La date est obligatoire."),
  ...fieldRules,
});
