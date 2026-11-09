"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteFicheButton({ id }: { id: string }) {
  const [error, setError] = useState("");
  const router = useRouter();
  async function remove() {
    if (!window.confirm("Supprimer définitivement cette fiche ? Cette action est irréversible.")) return;
    setError("");
    const { error: deleteError } = await createClient().from("fiches").delete().eq("id", id);
    if (deleteError) { setError(deleteError.message); return; }
    router.replace("/fiches"); router.refresh();
  }
  return <div><button onClick={() => void remove()} className="touch-button rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300">Supprimer</button>{error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}</div>;
}
