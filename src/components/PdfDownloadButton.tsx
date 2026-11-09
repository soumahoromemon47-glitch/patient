"use client";

import { Document, Page, StyleSheet, Text, View, PDFDownloadLink } from "@react-pdf/renderer";
import { formSchema, isFieldVisible } from "@/config/formSchema";
import type { Fiche } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 9, color: "#203532", fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5, color: "#23665d" },
  subtitle: { fontSize: 9, marginBottom: 14, color: "#53645f" },
  section: { marginTop: 10, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: "#23665d", fontSize: 11, fontWeight: "bold" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e1e8e4", paddingVertical: 4 },
  label: { width: "55%", color: "#586762" },
  value: { width: "45%", fontWeight: "bold" },
});
function valueText(value: unknown, type: string, options?: string[]) {
  if (type === "yesno") return value === "Oui" ? "☑ Oui" : value === "Non" ? "☐ Non" : "☐";
  if (type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (options ?? []).map((option) => `${selected.includes(option) ? "☑" : "☐"} ${option}`).join("   ");
  }
  if (Array.isArray(value)) return value.join(", ") || "—";
  return value === null || value === undefined || value === "" ? "—" : typeof value === "boolean" ? (value ? "☑ Oui" : "☐ Non") : String(value);
}

function FichePdf({ fiche }: { fiche: Fiche }) {
  return <Document title={`Fiche ${fiche.numero_fiche}`} author="CHU d’Angré">
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>FICHE D’ENQUÊTE — RISQUE DE CHUTE</Text>
      <Text style={styles.subtitle}>CHU d’Angré · 2026 · Données anonymisées</Text>
      <View style={styles.row}><Text style={styles.label}>N° de fiche</Text><Text style={styles.value}>{fiche.numero_fiche}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{fiche.date_fiche}</Text></View>
      {formSchema.map((section) => <View key={section.key} wrap={false}>
        <Text style={styles.section}>{section.title}</Text>
        {section.fields.filter((field) => !field.key.endsWith("_description") && isFieldVisible(field, fiche.data)).map((field) => {
          const value = field.computed ? fiche.computed[field.key] : fiche.data[field.key];
          return <View style={styles.row} key={field.key}><Text style={styles.label}>{field.label}{field.unit ? ` (${field.unit})` : ""}</Text><Text style={styles.value}>{valueText(value, field.type, field.options)}</Text></View>;
        })}
      </View>)}
      <Text style={{ marginTop: 16, color: "#718078", fontSize: 8 }}>Document confidentiel d’étude — identité du patient non collectée.</Text>
    </Page>
  </Document>;
}

export default function PdfDownloadButton({ fiche }: { fiche: Fiche }) {
  return <PDFDownloadLink document={<FichePdf fiche={fiche} />} fileName={`fiche-chute-${fiche.numero_fiche}.pdf`} className="touch-button rounded-xl border px-4 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5">
    {({ loading }) => loading ? "Préparation du PDF…" : "Télécharger en PDF"}
  </PDFDownloadLink>;
}
