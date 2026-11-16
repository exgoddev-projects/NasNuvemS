export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import {
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

import {
  FileGrid,
} from "@/components/files/file-grid";

export default async function FavoritosPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: arquivos, error } =
    await supabase
      .from("files")
      .select(
        "id, name, mime_type, size_bytes, is_favorite, folder_id, provider, provider_path"
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .eq("is_favorite", true)
      .order("created_at", {
        ascending: false,
      });

  const { data: destinos } =
    await supabase
      .from("folders")
      .select(
        "id, name, parent_id"
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("name");

  const pastasAtivas = new Set<string>(
    (destinos ?? []).map(
      (pasta: { id: string }) => pasta.id
    )
  );

  const b2 = createB2Client();

  const arquivosComPreview =
    await Promise.all(
      (arquivos ?? [])
        .filter(
          (arquivo: { folder_id: string | null }) =>
            arquivo.folder_id
              ? pastasAtivas.has(arquivo.folder_id)
              : true
        )
        .map(
        async (arquivo) => {
          let previewUrl:
            | string
            | null = null;

          if (
            (
              arquivo.mime_type?.startsWith(
                "image/"
              ) ||
              arquivo.mime_type?.startsWith(
                "video/"
              )
            ) &&
            arquivo.provider === "b2" &&
            arquivo.provider_path
          ) {
            previewUrl =
              await getSignedUrl(
                b2,
                new GetObjectCommand({
                  Bucket:
                    getB2BucketName(),
                  Key:
                    arquivo.provider_path,
                }),
                {
                  expiresIn: 900,
                }
              );
          }

          return {
            ...arquivo,
            previewUrl,
          };
        }
      )
    );

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
            <div className="text-xs text-amber-300">
              ⭐ Favoritos
            </div>

            <h1 className="font-bold">
              Meus favoritos
            </h1>
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                Não foi possível carregar os favoritos.
              </div>
            ) : arquivosComPreview.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-6xl">
                  ⭐
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  Nenhum favorito ainda
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Marque arquivos como favoritos para encontrá-los rapidamente aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <FileGrid
                  files={
                    arquivosComPreview
                  }
                  destinations={
                    destinos ?? []
                  }
                  currentFolderId=""
                />
              </div>
            )}

          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-800 px-4 text-xs text-slate-600">
          <span>
            {arquivosComPreview.length} favorito(s)
          </span>

          <span>
            NasNuvemS • v0.1.0
          </span>
        </footer>

      </div>
    </main>
  );
}
