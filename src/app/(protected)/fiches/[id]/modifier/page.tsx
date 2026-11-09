import { notFound } from "next/navigation";
import FicheForm from "@/components/FicheForm";
import { createClient } from "@/lib/supabase/server";
import type { Fiche } from "@/lib/types";

export default async function EditFichePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fiches").select("*").eq("id", params.id).single();
  if (error || !data) notFound();
  return <FicheForm fiche={data as Fiche} />;
}
