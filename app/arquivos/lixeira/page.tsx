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
  TrashGrid,
} from "@/components/files/trash-grid";

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

  const { data: arquivos, error } =
    await supabase
      .from("files")
      .select(
        "id, name, mime_type, size_bytes, provider, provider_path, deleted_at"
      )
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", {
        ascending: false,
      });

  const b2 = createB2Client();

  const arquivosComPreview =
    await Promise.all(
      (arquivos ?? []).map(
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
            <div className="text-xs text-red-400">
              🗑️ Lixeira
            </div>

            <h1 className="font-bold">
              Arquivos excluídos
            </h1>
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                Não foi possível carregar a lixeira.
              </div>
            ) : arquivosComPreview.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-6xl">
                  🗑️
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  A lixeira está vazia
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Arquivos removidos aparecerão aqui.
                </p>
              </div>
            ) : (
              <TrashGrid
                files={arquivosComPreview}
              />
            )}

          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-800 px-4 text-xs text-slate-600">
          <span>
            {arquivosComPreview.length} item(ns)
          </span>

          <span>
            NasNuvemS • v0.1.0
          </span>
        </footer>

      </div>
    </main>
  );
}
