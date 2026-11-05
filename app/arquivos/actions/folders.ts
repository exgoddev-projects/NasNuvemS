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

export async function renomearPasta(
  folderId: string,
  novoNome: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const nomeLimpo = novoNome.trim();

  if (!nomeLimpo) {
    throw new Error("Digite um nome para a pasta.");
  }

  if (nomeLimpo.length > 100) {
    throw new Error("O nome da pasta é muito longo.");
  }

  const { data: pasta, error: pastaError } =
    await supabase
      .from("folders")
      .select("id, parent_id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single();

  if (pastaError || !pasta) {
    throw new Error("Pasta não encontrada.");
  }

  const { error } = await supabase
    .from("folders")
    .update({
      name: nomeLimpo,
    })
    .eq("id", pasta.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  if (pasta.parent_id) {
    revalidatePath(`/arquivos/${pasta.parent_id}`);
  }

  revalidatePath(`/arquivos/${pasta.id}`);
}

export async function excluirPastas(
  folderIds: string[]
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const ids = Array.from(
    new Set(folderIds.filter(Boolean))
  );

  if (ids.length === 0) {
    throw new Error("Nenhuma pasta selecionada.");
  }

  const { data: pastas, error: foldersError } =
    await supabase
      .from("folders")
      .select("id, name, parent_id")
      .eq("user_id", user.id)
      .in("id", ids);

  if (foldersError) {
    throw new Error(foldersError.message);
  }

  if (!pastas || pastas.length !== ids.length) {
    throw new Error(
      "Uma ou mais pastas não foram encontradas."
    );
  }

  const possuiProtegida = pastas.some(
    (pasta) =>
      pasta.parent_id === null &&
      pastasProtegidas.has(pasta.name)
  );

  if (possuiProtegida) {
    throw new Error(
      "As pastas principais do NasNuvemS não podem ser excluídas."
    );
  }

  const parentIds = new Set(
    pastas
      .map((pasta) => pasta.parent_id)
      .filter(
        (id): id is string => typeof id === "string"
      )
  );

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("user_id", user.id)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  for (const parentId of parentIds) {
    revalidatePath(`/arquivos/${parentId}`);
  }

  revalidatePath("/arquivos");
}

export async function moverPastas(
  folderIds: string[],
  destinationId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const ids = Array.from(
    new Set(folderIds.filter(Boolean))
  );

  if (ids.length === 0) {
    throw new Error("Nenhuma pasta selecionada.");
  }

  if (!destinationId) {
    throw new Error("Escolha a pasta de destino.");
  }

  if (ids.includes(destinationId)) {
    throw new Error(
      "Uma pasta não pode ser movida para dentro dela mesma."
    );
  }

  const { data: pastas, error: foldersError } =
    await supabase
      .from("folders")
      .select("id, parent_id")
      .eq("user_id", user.id)
      .in("id", ids);

  if (foldersError) {
    throw new Error(foldersError.message);
  }

  if (!pastas || pastas.length !== ids.length) {
    throw new Error(
      "Uma ou mais pastas não foram encontradas."
    );
  }

  const { data: destino, error: destinationError } =
    await supabase
      .from("folders")
      .select("id, parent_id")
      .eq("id", destinationId)
      .eq("user_id", user.id)
      .single();

  if (destinationError || !destino) {
    throw new Error("Pasta de destino não encontrada.");
  }

  /*
   * Percorre os pais do destino.
   * Se encontrar uma pasta selecionada, o destino está
   * dentro dela e o movimento criaria um ciclo.
   */
  const selecionados = new Set(ids);
  const visitados = new Set<string>();
  let atual: {
    id: string;
    parent_id: string | null;
  } | null = destino;

  while (atual) {
    if (selecionados.has(atual.id)) {
      throw new Error(
        "Não é possível mover uma pasta para dentro dela própria ou de uma subpasta."
      );
    }

    if (visitados.has(atual.id)) {
      throw new Error(
        "Foi detectada uma estrutura de pastas inválida."
      );
    }

    visitados.add(atual.id);

    if (!atual.parent_id) {
      atual = null;
      continue;
    }

    const { data: parentData, error: parentError } =
      await supabase
        .from("folders")
        .select("id, parent_id")
        .eq("id", atual.parent_id)
        .eq("user_id", user.id)
        .single();

    if (parentError || !parentData) {
      throw new Error(
        "Não foi possível validar a pasta de destino."
      );
    }

    const parent: {
      id: string;
      parent_id: string | null;
    } = parentData;

    atual = parent;
  }

  const parentIdsAntigos = new Set(
    pastas
      .map((pasta) => pasta.parent_id)
      .filter(
        (id): id is string => typeof id === "string"
      )
  );

  const { error } = await supabase
    .from("folders")
    .update({
      parent_id: destinationId,
    })
    .eq("user_id", user.id)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  for (const parentId of parentIdsAntigos) {
    revalidatePath(`/arquivos/${parentId}`);
  }

  revalidatePath(`/arquivos/${destinationId}`);
  revalidatePath("/arquivos");
}
