export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createClient } from "@/lib/supabase/server";

import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

import { FilePreview } from "@/components/files/file-preview";

type PastaExcluida = {
  id: string;
  name: string;
  parent_id: string | null;
};

export default async function PastaNaLixeiraPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  await connection();

  const { folderId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: pastasExcluidas } = await supabase
    .from("folders")
    .select("id, name, parent_id")
    .eq("user_id", user.id)
    .not("deleted_at", "is", null);

  const porId = new Map<string, PastaExcluida>(
    (pastasExcluidas ?? []).map(
      (item: PastaExcluida): [string, PastaExcluida] => [
        item.id,
        item,
      ]
    )
  );

  const pasta = porId.get(folderId);

  if (!pasta) {
    notFound();
  }

  // Caminho dentro da lixeira (so pastas que tambem estao excluidas).
  const caminho: PastaExcluida[] = [];
  const visitadas = new Set<string>();
  let atual: PastaExcluida | undefined = pasta;

  while (atual && !visitadas.has(atual.id)) {
    visitadas.add(atual.id);
    caminho.unshift(atual);

    atual = atual.parent_id
      ? porId.get(atual.parent_id)
      : undefined;
  }

  const voltarPara =
    caminho.length > 1
      ? `/arquivos/lixeira/${caminho[caminho.length - 2].id}`
      : "/arquivos/lixeira";

  const subpastas: PastaExcluida[] = (pastasExcluidas ?? [])
    .filter(
      (item: PastaExcluida) => item.parent_id === pasta.id
    )
    .sort((a: PastaExcluida, b: PastaExcluida) =>
      a.name.localeCompare(b.name)
    );

  const { data: arquivos } = await supabase
    .from("files")
    .select(
      "id, name, mime_type, size_bytes, provider, provider_path"
    )
    .eq("user_id", user.id)
    .eq("folder_id", pasta.id)
    .order("name");

  const b2 = createB2Client();

  const arquivosComPreview = await Promise.all(
    (arquivos ?? []).map(
      async (arquivo: {
        id: string;
        name: string;
        mime_type: string | null;
        size_bytes: number | null;
        provider: string | null;
        provider_path: string | null;
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

  const total = subpastas.length + arquivosComPreview.length;

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      <div className="grid h-full grid-rows-[64px_minmax(0,1fr)_42px]">

        <header className="flex items-center gap-3 border-b border-slate-800 px-4 sm:px-6">
          <Link
            href={voltarPara}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
          >
            ←
          </Link>

          <div className="min-w-0">
            <div className="text-xs text-red-400">
              🗑️ Pasta na lixeira
            </div>

            <h1 className="truncate font-bold">
              {pasta.name}
            </h1>
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">

            <nav
              aria-label="Caminho na lixeira"
              className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm"
            >
              <Link
                href="/arquivos/lixeira"
                className="shrink-0 text-blue-400"
              >
                Lixeira
              </Link>

              {caminho.map((item, indice) => (
                <span
                  key={item.id}
                  className="flex shrink-0 items-center gap-2"
                >
                  <span className="text-slate-600">›</span>

                  {indice === caminho.length - 1 ? (
                    <span className="font-medium">
                      {item.name}
                    </span>
                  ) : (
                    <Link
                      href={`/arquivos/lixeira/${item.id}`}
                      className="text-blue-400"
                    >
                      {item.name}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            <p className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
              Visualização somente leitura. Para recuperar,
              volte à lixeira e restaure a pasta.
            </p>

            {total === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Esta pasta está vazia.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

                {subpastas.map((item) => (
                  <Link
                    key={item.id}
                    href={`/arquivos/lixeira/${item.id}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:bg-slate-800"
                  >
                    <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-950 text-5xl opacity-80">
                      📁
                    </div>

                    <div className="mt-4 truncate text-sm font-semibold">
                      {item.name}
                    </div>

                    <div className="mt-1 text-xs text-slate-600">
                      Subpasta
                    </div>
                  </Link>
                ))}

                {arquivosComPreview.map((file) => (
                  <div
                    key={file.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left"
                  >
                    {file.previewUrl ? (
                      <FilePreview
                        fileId={file.id}
                        name={file.name}
                        mimeType={file.mime_type}
                        sizeBytes={file.size_bytes}
                        previewUrl={file.previewUrl}
                        readOnly
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-950 text-4xl opacity-70">
                        {file.mime_type?.startsWith("video/")
                          ? "🎬"
                          : file.mime_type?.startsWith("audio/")
                            ? "🎵"
                            : file.mime_type === "application/pdf"
                              ? "📕"
                              : "📄"}
                      </div>
                    )}

                    <div className="mt-4 truncate text-sm font-semibold">
                      {file.name}
                    </div>

                    <div className="mt-1 text-xs text-slate-600">
                      Arquivo
                    </div>
                  </div>
                ))}
              </div>
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
