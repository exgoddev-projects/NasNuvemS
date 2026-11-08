import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { coletarArvore } from "@/lib/storage/purge-folders";

const LOTE = 100;

function emLotes<T>(itens: T[], tamanho: number) {
  const lotes: T[][] = [];

  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }

  return lotes;
}

/**
 * Envia as pastas e todas as subpastas para a lixeira.
 * Os arquivos nao mudam: somem da navegacao porque a pasta
 * deixa de existir para o usuario, e voltam junto com ela.
 */
export async function enviarPastasParaLixeira(
  supabase: SupabaseClient,
  userId: string,
  folderIds: string[]
) {
  const arvore = await coletarArvore(
    supabase,
    userId,
    folderIds
  );

  const agora = new Date().toISOString();

  for (const lote of emLotes(arvore, LOTE)) {
    const { error } = await supabase
      .from("folders")
      .update({ deleted_at: agora })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .in("id", lote);

    if (error) {
      throw new Error(error.message);
    }
  }
}

/**
 * Restaura as pastas e as subpastas que foram excluidas
 * junto com elas (mesmo horario de exclusao).
 */
export async function restaurarPastasDaLixeira(
  supabase: SupabaseClient,
  userId: string,
  folderIds: string[]
) {
  const { data: pastas, error } = await supabase
    .from("folders")
    .select("id, parent_id, deleted_at")
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .in("id", folderIds);

  if (error) {
    throw new Error(error.message);
  }

  if (!pastas || pastas.length !== folderIds.length) {
    throw new Error(
      "Uma ou mais pastas não estão na lixeira."
    );
  }

  for (const pasta of pastas) {
    if (pasta.parent_id) {
      const { data: pai } = await supabase
        .from("folders")
        .select("id, deleted_at")
        .eq("id", pasta.parent_id)
        .eq("user_id", userId)
        .single();

      if (!pai || pai.deleted_at) {
        throw new Error(
          "Restaure primeiro a pasta que contém esta."
        );
      }
    }

    const arvore = await coletarArvore(
      supabase,
      userId,
      [pasta.id]
    );

    for (const lote of emLotes(arvore, LOTE)) {
      const { error: updateError } = await supabase
        .from("folders")
        .update({ deleted_at: null })
        .eq("user_id", userId)
        .eq("deleted_at", pasta.deleted_at)
        .in("id", lote);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }
}
