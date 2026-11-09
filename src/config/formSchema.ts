export type FieldType =
  | "text"
  | "number"
  | "date"
  | "yesno"
  | "single"
  | "multi"
  | "computed";

export type FormField = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
  showIf?: { key: string; equals: string | number | boolean };
  precisionKey?: string;
  computed?: boolean;
  min?: number;
  max?: number;
  hint?: string;
  codeValues?: Record<string, number>;
};

export type FormSection = {
  key: string;
  title: string;
  description?: string;
  fields: FormField[];
};

const ouiNon = ["Oui", "Non"];
const choix = (key: string, label: string, options: string[]): FormField => ({
  key,
  label,
  type: "single",
  options,
});
const ouiNonField = (key: string, label: string): FormField => ({
  key,
  label,
  type: "yesno",
  options: ouiNon,
});
const precision = (key: string, label = "Précisez"): FormField => ({
  key,
  label,
  type: "text",
  precisionKey: key.replace("_precision", ""),
});

export const formSchema: FormSection[] = [
  {
    key: "sociodemographique",
    title: "I. Caractéristiques sociodémographiques",
    fields: [
      {
        key: "age",
        label: "Âge",
        type: "number",
        unit: "ans",
        min: 0,
        max: 120,
      },
      {
        key: "tranche_age",
        label: "Tranche d’âge",
        type: "computed",
        computed: true,
      },
      choix("sexe", "Sexe", ["Masculin", "Féminin"]),
      choix("situation_matrimoniale", "Situation matrimoniale", [
        "Célibataire",
        "Marié(e)",
        "Veuf(ve)",
        "Divorcé(e)",
      ]),
      choix("niveau_instruction", "Niveau d’instruction", [
        "Aucun",
        "Primaire",
        "Secondaire",
        "Supérieur",
      ]),
      choix("activite", "Activité", [
        "Aucune",
        "À temps plein",
        "À temps partiel",
      ]),
      choix("residence", "Résidence", ["Urbain", "Rural"]),
      ouiNonField("maison_plain_pied", "Maison de plain-pied"),
      choix("vit_a_domicile", "Vit à domicile", ["Seul(e)", "Avec un aidant"]),
      choix("autonomie", "Autonomie", ["AVQ", "IAVQ"]),
    ],
  },
  {
    key: "vp",
    title: "II. VP",
    fields: [{ key: "vp", label: "VP", type: "text" }],
  },
  {
    key: "antecedents",
    title: "III. Antécédents",
    description: "Antécédents médicaux",
    fields: [
      ...[
        ["hta", "HTA"],
        ["diabete", "Diabète"],
        ["avc", "AVC"],
        ["parkinson", "Parkinson"],
        ["arthrose", "Arthrose"],
        ["osteoporose", "Ostéoporose"],
        ["troubles_visuels", "Troubles visuels"],
        ["troubles_auditifs", "Troubles auditifs"],
        ["troubles_cognitifs", "Troubles cognitifs"],
        ["vertiges", "Vertiges"],
        ["incontinence_urinaire", "Incontinence urinaire"],
        ["depression", "Dépression"],
      ].map(([key, label]) => ouiNonField(key, label)),

      ouiNonField("chute_12m", "Chute au cours des 12 derniers mois"),
      {
        key: "nombre_chutes",
        label: "Nombre de chutes",
        type: "number",
        min: 0,
        showIf: { key: "chute_12m", equals: "Oui" },
      },
      {
        ...choix("moment_chute", "Moment de la chute", [
          "Matin",
          "Midi",
          "Soir",
        ]),
        showIf: { key: "chute_12m", equals: "Oui" },
      },
      {
        key: "lieu_chute",
        label: "Lieu de la chute",
        type: "text",
        showIf: { key: "chute_12m", equals: "Oui" },
      },
      ouiNonField("consequences_immediates", "Conséquences immédiates"),
      {
        ...precision("consequences_immediates_precision"),
        label:
          "Précisez (traumatisme, fracture, plaie, rhabdomyolyse, hospitalisation…)",
        showIf: { key: "consequences_immediates", equals: "Oui" },
      },
      ouiNonField("consequences_psy", "Conséquences psychologiques"),
      {
        ...precision("consequences_psy_precision"),
        showIf: { key: "consequences_psy", equals: "Oui" },
      },
      ouiNonField(
        "troubles_depressifs_chute",
        "Troubles dépressifs après la chute",
      ),
      ouiNonField(
        "troubles_cognitifs_chute",
        "Troubles cognitifs après la chute",
      ),
    ],
  },
  {
    key: "predisposants",
    title: "IV. Facteurs de risque prédisposants",
    description: "Marche et équilibre",
    fields: [
      ...[
        ["troubles_marche", "Troubles de la marche"],
        ["force_musculaire_reduite", "Force musculaire réduite"],
        ["chute_12m_iv", "Chute au cours des 12 derniers mois"],
        ["aide_technique", "Utilisation d’une aide technique"],
      ].map(([key, label]) => ouiNonField(key, label)),
      {
        key: "type_aide",
        label: "Type d’aide technique",
        type: "multi",
        options: ["Canne", "Déambulateur", "Béquilles", "Fauteuil roulant"],
        showIf: { key: "aide_technique", equals: "Oui" },
      },
      ouiNonField("arthrose_mi", "Arthrose des membres inférieurs"),
      {
        key: "sensoriel_description",
        label: "Sensoriels et neurocognitifs",
        type: "computed",
        computed: true,
      },
      ...[
        ["acuite_visuelle_baisse", "Baisse de l’acuité visuelle"],
        ["audition_trouble", "Trouble de l’audition"],
        ["tnc", "Trouble neurocognitif (TNC)"],
        ["depression_iv", "Dépression"],
        ["ethylisme", "Éthylisme"],
      ].map(([key, label]) => ouiNonField(key, label)),
      {
        key: "medicaments_description",
        label: "Facteurs médicaux et médicamenteux",
        type: "computed",
        computed: true,
      },
      {
        key: "nb_medicaments",
        label: "Nombre de médicaments",
        type: "number",
        min: 0,
      },
      {
        key: "polymedication",
        label: "Polymédication (≥ 5 médicaments)",
        type: "computed",
        computed: true,
      },
      ...[
        ["psychotropes", "Psychotropes"],
        ["antihypertenseurs", "Antihypertenseurs"],
        ["diuretiques", "Diurétiques"],
        ["antidiabetiques_oraux", "Antidiabétiques oraux"],
        ["anticholinergiques", "Anticholinergiques"],
        [
          "hypotension_orthostatique_ant",
          "Hypotension orthostatique antérieure",
        ],
      ].flatMap(([key, label]) => [
        ouiNonField(key, label),
        {
          key: `${key}_precision`,
          label: "Précisez",
          type: "text" as const,
          showIf: { key, equals: "Oui" },
        },
      ]),
      ouiNonField(
        "troubles_rythme_conduction",
        "Troubles du rythme / de la conduction",
      ),
      ouiNonField("incontinence_iv", "Incontinence"),
      ouiNonField("denutrition", "Dénutrition"),
      ouiNonField("carence_vit_d", "Carence en vitamine D"),
    ],
  },
  {
    key: "precipitants",
    title: "V. Facteurs précipitants",
    fields: [
      ...[
        ["malaise_pc", "Malaise / perte de connaissance"],
        ["hypotension_documentee", "Hypotension documentée"],
        ["trouble_rythme", "Trouble du rythme"],
        ["avc_v", "AVC"],
        ["trouble_vestibulaire", "Trouble vestibulaire"],
        ["hypoglycemie", "Hypoglycémie"],
        ["nouveau_medicament", "Nouveau médicament"],
        ["modification_posologie", "Modification de posologie"],
      ].map(([key, label]) => ouiNonField(key, label)),
      {
        key: "nouveau_medicament_precision",
        label: "Précisez le nouveau médicament",
        type: "text",
        showIf: { key: "nouveau_medicament", equals: "Oui" },
      },
      {
        key: "modification_posologie_precision",
        label: "Précisez la modification",
        type: "text",
        showIf: { key: "modification_posologie", equals: "Oui" },
      },
    ],
  },
  {
    key: "examen",
    title: "VI. Examen clinique du sujet âgé",
    fields: [
      {
        key: "poids",
        label: "Poids",
        type: "number",
        unit: "kg",
        min: 1,
        max: 300,
      },
      {
        key: "taille",
        label: "Taille",
        type: "number",
        unit: "m",
        min: 0.5,
        max: 2.5,
      },
      {
        key: "imc",
        label: "Indice de masse corporelle (IMC)",
        type: "computed",
        computed: true,
        unit: "kg/m²",
      },
      ouiNonField("reduction_apport", "Réduction des apports"),
      {
        key: "fc",
        label: "Fréquence cardiaque",
        type: "number",
        unit: "bpm",
        min: 20,
        max: 250,
      },

      { key: "exam_neuro", label: "Examen neurologique", type: "text" },
    ],
  },
  {
    key: "unipodale",
    title: "VII. Test de station unipodale",
    description:
      "Consigne : tenir en équilibre sur une jambe, yeux ouverts, au moins 5 secondes.",
    fields: [
      {
        key: "unipodal_secondes",
        label: "Durée de station unipodale",
        type: "number",
        unit: "secondes",
        min: 0,
      },
      {
        key: "niveau_risque",
        label: "Niveau de risque",
        type: "computed",
        computed: true,
      },
    ],
  },
];

export const allFields = formSchema.flatMap((section) => section.fields);
export const dataFields = allFields.filter((field) => !field.computed);
export const computedFields = allFields.filter(
  (field) => field.computed && !field.key.endsWith("_description"),
);
export const fieldByKey = Object.fromEntries(
  allFields.map((field) => [field.key, field]),
) as Record<string, FormField>;
export const ageRanges = ["60-69", "70-79", "80-89", "90+"] as const;
export const isFieldVisible = (
  field: FormField,
  values: Record<string, unknown>,
) => !field.showIf || values[field.showIf.key] === field.showIf.equals;
