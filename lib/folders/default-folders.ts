import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const PASTAS_PADRAO = [
  "Documentos",
  "Imagens",
  "Vídeos",
  "Músicas",
  "Downloads",
  "Backups",
];

/**
 * Cria as pastas padrao quando o usuario ainda nao tem nenhuma
 * pasta na raiz (contando tambem as que estao na lixeira).
 * Retorna true se criou.
 */
export async function garantirPastasPadrao(
  supabase: SupabaseClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("folders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("parent_id", null);

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) > 0) {
    return false;
  }

  const { error: insertError } = await supabase
    .from("folders")
    .insert(
      PASTAS_PADRAO.map((nome) => ({
        user_id: userId,
        name: nome,
        parent_id: null,
      }))
    );

  if (insertError) {
    throw new Error(insertError.message);
  }

  return true;
}
