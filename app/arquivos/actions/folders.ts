"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const pastasProtegidas = new Set([
  "Documentos",
  "Imagens",
  "Vídeos",
  "Músicas",
  "Downloads",
  "Backups",
]);

export async function criarPasta(
  parentId: string,
  nome: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const nomeLimpo = nome.trim();

  if (!nomeLimpo) {
    throw new Error("Digite um nome para a pasta.");
  }

  if (nomeLimpo.length > 100) {
    throw new Error(
      "O nome da pasta é muito longo."
    );
  }

  const { data: parent, error: parentError } =
    await supabase
      .from("folders")
      .select("id")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .single();

  if (parentError || !parent) {
    throw new Error(
      "Pasta de destino não encontrada."
    );
  }

  const { error } = await supabase
    .from("folders")
    .insert({
      user_id: user.id,
      parent_id: parent.id,
      name: nomeLimpo,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/arquivos/${parent.id}`);
}

export async function excluirPasta(
  folderId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: pasta, error: folderError } =
    await supabase
      .from("folders")
      .select("id, name, parent_id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single();

  if (folderError || !pasta) {
    throw new Error("Pasta não encontrada.");
  }

  if (
    pasta.parent_id === null &&
    pastasProtegidas.has(pasta.name)
  ) {
    throw new Error(
      "As pastas principais do NasNuvemS não podem ser excluídas."
    );
  }

  const parentId = pasta.parent_id;

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", pasta.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  if (parentId) {
    revalidatePath(`/arquivos/${parentId}`);
  }

  revalidatePath("/arquivos");
}
