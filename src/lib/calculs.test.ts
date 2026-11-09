import { describe, expect, it } from "vitest";
import {
  calculerHypotensionOrthostatique, calculerImc, calculerNiveauRisque, calculerPam, calculerPolymedication,
  calculerTrancheAge,
} from "./calculs";

describe("calculs cliniques", () => {
  it("calcule l'IMC arrondi à une décimale", () => {
    expect(calculerImc(70, 1.75)).toBe(22.9);
    expect(calculerImc(70, 0)).toBeNull();
  });
  it("calcule la PAM arrondie à l'entier", () => expect(calculerPam(120, 80)).toBe(93));
  it("détecte l'hypotension orthostatique avec les seuils inclusifs", () => {
    expect(calculerHypotensionOrthostatique({ pa_assis_sys: 140, pa_assis_dia: 90, pa_debout_sys: 120, pa_debout_dia: 85 }).presente).toBe(true);
    expect(calculerHypotensionOrthostatique({ pa_assis_sys: 120, pa_assis_dia: 80, pa_debout_sys: 110, pa_debout_dia: 70 }).presente).toBe(true);
  });
  it("considère cinq médicaments comme une polymédication", () => {
    expect(calculerPolymedication(5)).toBe(true);
    expect(calculerPolymedication(4)).toBe(false);
  });
  it.each([[4.9, "Risque de chute élevé"], [5, "Risque modéré"], [30, "Risque modéré"], [30.1, "Risque faible"]])(
    "classe %s secondes",
    (secondes, attendu) => expect(calculerNiveauRisque(secondes)).toBe(attendu),
  );
  it("classe les âges dans les tranches prévues pour l’étude", () => {
    expect(calculerTrancheAge(59)).toBeNull();
    expect(calculerTrancheAge(60)).toBe("60-69");
    expect(calculerTrancheAge(70)).toBe("70-79");
    expect(calculerTrancheAge(80)).toBe("80-89");
    expect(calculerTrancheAge(90)).toBe("90+");
  });
});
