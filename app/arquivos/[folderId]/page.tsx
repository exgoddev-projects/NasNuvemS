export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { NewFolderButton } from "@/components/folders/new-folder-button";
import { DeleteFolderButton } from "@/components/folders/delete-folder-button";
import { FolderGrid } from "@/components/folders/folder-grid";
import { UploadButton } from "@/components/files/upload-button";
import { FilePreview } from "@/components/files/file-preview";
import { FileGrid } from "@/components/files/file-grid";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PastaPage({
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

  const { data: pasta, error } = await supabase
    .from("folders")
    .select("id, name, parent_id")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .single();

  if (error || !pasta) {
    notFound();
  }

  const { data: destinos } = await supabase
    .from("folders")
    .select("id, name, parent_id")
    .eq("user_id", user.id)
    .order("name");

  const { data: subpastas } = await supabase
    .from("folders")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("parent_id", pasta.id)
    .order("name");

  const { data: arquivos } = await supabase
    .from("files")
    .select("id, name, mime_type, size_bytes, is_favorite, provider, provider_path")
    .eq("user_id", user.id)
    .eq("folder_id", pasta.id)
    .is("deleted_at", null)
    .order("name");

  const b2 = createB2Client();

  const arquivosComPreview = await Promise.all(
    (arquivos ?? []).map(async (arquivo) => {
      let previewUrl: string | null = null;

      const ehMidia =
        (
          arquivo.mime_type?.startsWith("image/") ||
          arquivo.mime_type?.startsWith("video/")
        ) &&
        arquivo.provider === "b2" &&
        arquivo.provider_path;

      if (ehMidia) {
        previewUrl = await getSignedUrl(
          b2,
          new GetObjectCommand({
            Bucket: getB2BucketName(),
            Key: arquivo.provider_path,
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
    })
  );

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      <div className="grid h-full grid-rows-[64px_minmax(0,1fr)_42px]">

        <header className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/arquivos"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900"
            >
              ←
            </Link>

            <div className="min-w-0">
              <div className="text-xs text-slate-500">
                NasNuvemS
              </div>

              <h1 className="truncate font-bold">
                {pasta.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UploadButton folderId={pasta.id} />
            <NewFolderButton parentId={pasta.id} />
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">

            <div className="mb-6 flex items-center gap-2 overflow-x-auto text-sm">
              <Link
                href="/arquivos"
                className="shrink-0 text-blue-400"
              >
                Meus arquivos
              </Link>

              <span className="text-slate-600">›</span>

              <span className="truncate font-medium">
                {pasta.name}
              </span>
            </div>

            {(subpastas?.length ?? 0) === 0 &&
            (arquivos?.length ?? 0) === 0 ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                <div className="text-6xl">📂</div>

                <h2 className="mt-5 text-xl font-bold">
                  Esta pasta está vazia
                </h2>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Futuramente você poderá criar subpastas
                  e enviar arquivos para este local.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <div className="col-span-full">
                  <FolderGrid
                    folders={subpastas ?? []}
                    destinations={destinos ?? []}
                    currentFolderId={pasta.id}
                  />
                </div>

                <FileGrid
                  files={arquivosComPreview}
                  destinations={destinos ?? []}
                  currentFolderId={pasta.id}
                />
              </div>
            )}
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-800 px-4 text-[10px] text-slate-600 sm:px-6 sm:text-xs">
          <span>
            {(subpastas?.length ?? 0) +
              (arquivos?.length ?? 0)} itens
          </span>

          <span>NasNuvemS • v0.1.0</span>
        </footer>

      </div>
    </main>
  );
}
