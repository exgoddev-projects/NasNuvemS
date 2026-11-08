import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DeleteObjectsCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

const LOTE_CONSULTA = 100;
const LOTE_B2 = 1000;

function emLotes<T>(itens: T[], tamanho: number) {
  const lotes: T[][] = [];

  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }

  return lotes;
}

/**
 * Retorna os ids das pastas informadas
 * mais todas as subpastas, em qualquer nivel.
 */
async function coletarArvore(
  supabase: SupabaseClient,
  userId: string,
  raizes: string[]
) {
  const todas = new Set<string>(raizes);
  let nivel = [...raizes];

  while (nivel.length > 0) {
    const proximo: string[] = [];

    for (const lote of emLotes(nivel, LOTE_CONSULTA)) {
      const { data, error } = await supabase
        .from("folders")
        .select("id")
        .eq("user_id", userId)
        .in("parent_id", lote);

      if (error) {
        throw new Error(error.message);
      }

      for (const pasta of data ?? []) {
        if (!todas.has(pasta.id)) {
          todas.add(pasta.id);
          proximo.push(pasta.id);
        }
      }
    }

    nivel = proximo;
  }

  return Array.from(todas);
}

const CODIGOS_JA_REMOVIDO = new Set([
  "NoSuchKey",
  "NoSuchVersion",
  "NotFound",
]);

async function removerRegistros(
  supabase: SupabaseClient,
  userId: string,
  fileIds: string[]
) {
  for (const lote of emLotes(fileIds, LOTE_CONSULTA)) {
    const { error } = await supabase
      .from("files")
      .delete()
      .eq("user_id", userId)
      .in("id", lote);

    if (error) {
      throw new Error(error.message);
    }
  }
}

/**
 * Apaga no B2 TODOS os arquivos (inclusive os que
 * estao na lixeira) das pastas e subpastas informadas.
 *
 * - Cada arquivo confirmado como apagado no B2 (ou que
 *   ja nao existia la) tem seu registro removido do banco
 *   na hora, entao nao sobram registros mortos.
 * - Os que o B2 recusar continuam registrados.
 * - Se houver qualquer falha, lanca erro e as PASTAS nao
 *   sao excluidas; basta repetir a operacao com seguranca.
 *
 * Deve ser chamada ANTES de excluir as pastas no banco.
 */
export async function apagarArquivosDasPastas(
  supabase: SupabaseClient,
  userId: string,
  folderIds: string[]
) {
  const pastas = await coletarArvore(
    supabase,
    userId,
    folderIds
  );

  const arquivos: Array<{
    id: string;
    name: string;
    provider: string | null;
    provider_file_id: string | null;
    provider_path: string | null;
  }> = [];

  for (const lote of emLotes(pastas, LOTE_CONSULTA)) {
    const { data, error } = await supabase
      .from("files")
      .select(
        "id, name, provider, provider_file_id, provider_path"
      )
      .eq("user_id", userId)
      .in("folder_id", lote);

    if (error) {
      throw new Error(error.message);
    }

    arquivos.push(...(data ?? []));
  }

  if (arquivos.length === 0) {
    return { pastas: pastas.length, arquivos: 0 };
  }

  const naoSuportado = arquivos.find(
    (arquivo) =>
      arquivo.provider !== "b2" ||
      !arquivo.provider_path
  );

  if (naoSuportado) {
    throw new Error(
      `O arquivo "${naoSuportado.name}" usa um storage ainda nao suportado para exclusao.`
    );
  }

  const b2 = createB2Client();
  const bucket = getB2BucketName();

  // Arquivos que ja nao existem no B2: so falta limpar o registro.
  const jaRemovidos: string[] = [];

  const pendentes: Array<{
    fileId: string;
    Key: string;
    VersionId: string;
  }> = [];

  for (const arquivo of arquivos) {
    let versionId = arquivo.provider_file_id;

    if (!versionId) {
      try {
        const metadata = await b2.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: arquivo.provider_path!,
          })
        );

        versionId = metadata.VersionId ?? null;
      } catch (error) {
        const nome =
          error instanceof Error ? error.name : "";

        if (CODIGOS_JA_REMOVIDO.has(nome)) {
          jaRemovidos.push(arquivo.id);
          continue;
        }

        throw error;
      }
    }

    if (!versionId) {
      throw new Error(
        `Nao foi possivel identificar a versao de ${arquivo.name}.`
      );
    }

    pendentes.push({
      fileId: arquivo.id,
      Key: arquivo.provider_path!,
      VersionId: versionId,
    });
  }

  if (jaRemovidos.length > 0) {
    await removerRegistros(
      supabase,
      userId,
      jaRemovidos
    );
  }

  let falhas = 0;

  for (const lote of emLotes(pendentes, LOTE_B2)) {
    const resposta = await b2.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: lote.map(({ Key, VersionId }) => ({
            Key,
            VersionId,
          })),
          Quiet: false,
        },
      })
    );

    const chavesComErro = new Set<string>();

    for (const item of resposta.Errors ?? []) {
      if (item.Key && !CODIGOS_JA_REMOVIDO.has(item.Code ?? "")) {
        chavesComErro.add(item.Key);
      }
    }

    const confirmados = lote
      .filter((item) => !chavesComErro.has(item.Key))
      .map((item) => item.fileId);

    falhas += chavesComErro.size;

    // Remove do banco so o que o B2 confirmou (ou ja nao existia).
    await removerRegistros(supabase, userId, confirmados);
  }

  if (falhas > 0) {
    throw new Error(
      `${falhas} arquivo(s) nao puderam ser excluidos no storage e continuam registrados. Tente novamente.`
    );
  }

  return {
    pastas: pastas.length,
    arquivos: arquivos.length,
  };
}
