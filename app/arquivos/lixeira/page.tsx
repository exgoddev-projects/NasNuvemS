export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createClient } from "@/lib/supabase/server";

import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

import { TrashGrid } from "@/components/files/trash-grid";

export default async function LixeiraPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: pastasExcluidas, error: pastasError } =
    await supabase
      .from("folders")
      .select("id, name, parent_id, deleted_at")
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

  const idsExcluidos = new Set<string>(
    (pastasExcluidas ?? []).map(
      (pasta: { id: string }) => pasta.id
    )
  );

  // Mostra so as pastas "de cima": as subpastas vao junto com a pasta mae.
  const pastasNaLixeira = (pastasExcluidas ?? []).filter(
    (pasta: { parent_id: string | null }) =>
      !pasta.parent_id || !idsExcluidos.has(pasta.parent_id)
  );

  const { data: arquivos, error: arquivosError } =
    await supabase
      .from("files")
      .select(
        "id, name, mime_type, size_bytes, provider, provider_path, deleted_at, folder_id"
      )
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

  // Arquivos de pastas excluidas aparecem dentro da pasta, nao soltos.
  const arquivosVisiveis = (arquivos ?? []).filter(
    (arquivo: { folder_id: string | null }) =>
      !arquivo.folder_id ||
      !idsExcluidos.has(arquivo.folder_id)
  );

  const error = pastasError || arquivosError;

  const b2 = createB2Client();

  const arquivosComPreview = await Promise.all(
    arquivosVisiveis.map(
      async (arquivo: {
        id: string;
        name: string;
        mime_type: string | null;
        size_bytes: number | null;
        provider: string | null;
        provider_path: string | null;
        deleted_at: string | null;
      }) => {
        let previewUrl: string | null = null;

        if (
          (arquivo.mime_type?.startsWith("image/") ||
            arquivo.mime_type?.startsWith("video/")) &&
          arquivo.provider === "b2" &&
          arquivo.provider_path
        ) {
          previewUrl = await getSignedUrl(
            b2,
            new GetObjectCommand({
              Bucket: getB2BucketName(),
              Key: arquivo.provider_path,
            }),
            { expiresIn: 900 }
          );
        }

        return {
          ...arquivo,
          previewUrl,
        };
      }
    )
  );

  const total =
    pastasNaLixeira.length + arquivosComPreview.length;

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      <div className="grid h-full grid-rows-[64px_minmax(0,1fr)_42px]">

        <header className="flex items-center gap-3 border-b border-slate-800 px-4 sm:px-6">
          <Link
            href="/arquivos"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
          >
            ←
          </Link>

          <div>
            <div className="text-xs text-red-400">
              🗑️ Lixeira
            </div>

            <h1 className="font-bold">
              Itens excluídos
            </h1>
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                Não foi possível carregar a lixeira.
              </div>
            ) : total === 0 ? (
              <div className="py-20 text-center">
                <div className="text-6xl">🗑️</div>

                <h2 className="mt-5 text-xl font-bold">
                  A lixeira está vazia
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Arquivos e pastas removidos aparecerão aqui.
                </p>
              </div>
            ) : (
              <TrashGrid
                files={arquivosComPreview}
                folders={pastasNaLixeira}
              />
            )}

          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-800 px-4 text-xs text-slate-600">
          <span>{total} item(ns)</span>

          <span>NasNuvemS • v0.1.0</span>
        </footer>

      </div>
    </main>
  );
}
