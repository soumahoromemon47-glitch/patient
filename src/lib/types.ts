export type Fiche = {
  id: string;
  numero_fiche: string;
  date_fiche: string;
  statut: "brouillon" | "complete";
  data: Record<string, unknown>;
  computed: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};
