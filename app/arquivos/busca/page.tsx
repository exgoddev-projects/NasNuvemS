export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Pasta = {
  id: string;
  name: string;
  parent_id: string | null;
};

type Arquivo = {
  id: string;
  name: string;
  folder_id: string | null;
  mime_type: string | null;
  is_favorite: boolean | null;
};

function iconeDoArquivo(mime: string | null) {
  if (mime?.startsWith("image/")) return "🖼️";
  if (mime?.startsWith("video/")) return "🎬";
  if (mime?.startsWith("audio/")) return "🎵";
  return "📄";
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await connection();

  const { q } = await searchParams;

  const termo = (Array.isArray(q) ? q[0] : q ?? "")
    .trim()
    .slice(0, 80);

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  let pastasEncontradas: Pasta[] = [];
  let arquivosEncontrados: Arquivo[] = [];
  let todasPastas: Pasta[] = [];
  let falhou = false;

  if (termo.length > 0) {
    // Escapa % e _ para que sejam tratados como texto comum.
    const padrao = `%${termo.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

    const [pastasRes, arquivosRes, todasRes] =
      await Promise.all([
        supabase
          .from("folders")
          .select("id, name, parent_id")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .ilike("name", padrao)
          .order("name")
          .limit(50),

        supabase
          .from("files")
          .select(
            "id, name, folder_id, mime_type, is_favorite"
          )
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .ilike("name", padrao)
          .order("name")
          .limit(50),

        supabase
          .from("folders")
          .select("id, name, parent_id")
          .eq("user_id", user.id)
          .is("deleted_at", null),
      ]);

    falhou = Boolean(
      pastasRes.error || arquivosRes.error || todasRes.error
    );

    pastasEncontradas = pastasRes.data ?? [];
    todasPastas = todasRes.data ?? [];

    const pastasAtivas = new Set<string>(
      todasPastas.map((pasta) => pasta.id)
    );

    arquivosEncontrados = (arquivosRes.data ?? []).filter(
      (arquivo: Arquivo) =>
        arquivo.folder_id
          ? pastasAtivas.has(arquivo.folder_id)
          : true
    );
  }

  const pastasPorId = new Map<string, Pasta>(
    todasPastas.map((pasta): [string, Pasta] => [
      pasta.id,
      pasta,
    ])
  );

  function caminhoDe(folderId: string | null) {
    const nomes: string[] = [];
    const visitadas = new Set<string>();
    let atual = folderId
      ? pastasPorId.get(folderId)
      : undefined;

    while (atual && !visitadas.has(atual.id)) {
      visitadas.add(atual.id);
      nomes.unshift(atual.name);

      atual = atual.parent_id
        ? pastasPorId.get(atual.parent_id)
        : undefined;
    }

    return ["Meus arquivos", ...nomes].join(" › ");
  }

  const total =
    pastasEncontradas.length + arquivosEncontrados.length;

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      <div className="grid h-full grid-rows-[64px_minmax(0,1fr)_42px]">

        <header className="flex items-center gap-3 border-b border-slate-800 px-4 sm:px-6">
          <Link
            href="/arquivos"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800"
          >
            ←
          </Link>

          <div>
            <div className="text-xs text-slate-500">
              NasNuvemS
            </div>

            <h1 className="font-bold">Buscar</h1>
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">

            <form
              action="/arquivos/busca"
              method="get"
              className="flex gap-2"
            >
              <input
                type="search"
                name="q"
                defaultValue={termo}
                autoFocus
                placeholder="Buscar arquivos e pastas"
                className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
              />

              <button
                type="submit"
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
              >
                Buscar
              </button>
            </form>

            {falhou && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                Não foi possível fazer a busca.
              </div>
            )}

            {!falhou && termo.length === 0 && (
              <p className="mt-10 text-center text-sm text-slate-500">
                Digite o nome de um arquivo ou pasta.
              </p>
            )}

            {!falhou && termo.length > 0 && total === 0 && (
              <div className="py-16 text-center">
                <div className="text-5xl">🔎</div>

                <p className="mt-4 text-sm text-slate-500">
                  Nada encontrado para “{termo}”.
                </p>
              </div>
            )}

            {total > 0 && (
              <ul className="mt-6 space-y-2">
                {pastasEncontradas.map((pasta) => (
                  <li key={`p-${pasta.id}`}>
                    <Link
                      href={`/arquivos/${pasta.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3 hover:bg-slate-800"
                    >
                      <span className="text-2xl">📁</span>

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {pasta.name}
                        </span>

                        <span className="block truncate text-xs text-slate-500">
                          {caminhoDe(pasta.parent_id)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}

                {arquivosEncontrados.map((arquivo) => (
                  <li key={`f-${arquivo.id}`}>
                    <Link
                      href={
                        arquivo.folder_id
                          ? `/arquivos/${arquivo.folder_id}`
                          : "/arquivos"
                      }
                      className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3 hover:bg-slate-800"
                    >
                      <span className="text-2xl">
                        {iconeDoArquivo(arquivo.mime_type)}
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {arquivo.is_favorite ? "⭐ " : ""}
                          {arquivo.name}
                        </span>

                        <span className="block truncate text-xs text-slate-500">
                          {caminhoDe(arquivo.folder_id)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-800 px-4 text-[10px] text-slate-600 sm:px-6 sm:text-xs">
          <span>
            {termo.length > 0 ? `${total} resultado(s)` : ""}
          </span>

          <span>NasNuvemS • v0.1.0</span>
        </footer>
      </div>
    </main>
  );
}
