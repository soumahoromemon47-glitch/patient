import { describe, expect, it } from "vitest";
import { ficheSchema } from "./validation";

describe("validation des fiches", () => {
  it("accepte les champs numériques facultatifs laissés vides", () => {
    const result = ficheSchema.safeParse({
      numero_fiche: "F-001",
      date_fiche: "2026-11-09",
      nombre_chutes: undefined,
    });

    expect(result.success).toBe(true);
  });

  it("valide les limites des champs numériques renseignés", () => {
    const valid = ficheSchema.safeParse({
      numero_fiche: "F-001",
      date_fiche: "2026-11-09",
      nombre_chutes: 2,
    });
    const invalid = ficheSchema.safeParse({
      numero_fiche: "F-001",
      date_fiche: "2026-11-09",
      nombre_chutes: -1,
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("conserve les mesures assises et les constats de l'examen", () => {
    const result = ficheSchema.safeParse({
      numero_fiche: "F-002",
      date_fiche: "2026-11-09",
      pa_assis_sys: 120,
      pa_assis_dia: 80,
      arthrose_examen: "Oui",
      deficit_visuel_examen: "Non",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        pa_assis_sys: 120,
        pa_assis_dia: 80,
        arthrose_examen: "Oui",
        deficit_visuel_examen: "Non",
      });
    }

    const invalidPressure = ficheSchema.safeParse({
      numero_fiche: "F-003",
      date_fiche: "2026-11-09",
      pa_assis_sys: 0,
    });
    expect(invalidPressure.success).toBe(false);
  });
});
