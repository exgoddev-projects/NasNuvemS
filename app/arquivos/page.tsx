export const instant = false;

import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Folder = {
  id: string;
  name: string;
};

const icones: Record<string, string> = {
  Documentos: "📄",
  Imagens: "🖼️",
  Vídeos: "🎬",
  Músicas: "🎵",
  Downloads: "⬇️",
  Backups: "💾",
};

export default async function ArquivosPage() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("folders")
    .select("id, name")
    .eq("user_id", user.id)
    .is("parent_id", null)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const pastas = (data ?? []) as Folder[];

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      <div className="grid h-full grid-rows-[64px_minmax(0,1fr)_42px]">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl">
              ☁
            </div>

            <div>
              <h1 className="font-bold tracking-tight">
                NasNuvemS
              </h1>

              <p className="text-[10px] text-slate-500 sm:text-xs">
                Explorador de arquivos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/arquivos/busca"
              aria-label="Buscar"
              title="Buscar"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-lg hover:bg-slate-800"
            >
              🔍
            </Link>

            <Link
              href="/armazenamento"
              aria-label="Armazenamento"
              title="Armazenamento"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-lg transition hover:bg-slate-800 md:hidden"
            >
              ☁️
            </Link>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold"
              title={user.email ?? "Usuário"}
            >
              {(user.email?.[0] ?? "U").toUpperCase()}
            </div>
          </div>
        </header>

        <div className="grid min-h-0 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 border-r border-slate-800 bg-slate-950 p-4 md:flex md:flex-col">
            <nav className="space-y-1">
              <a
                href="/arquivos"
                className="flex items-center gap-3 rounded-xl bg-blue-600/15 px-4 py-3 text-sm font-semibold text-blue-300"
              >
                <span>📁</span>
                Meus arquivos
              </a>

              <Link
                href="/arquivos/favoritos"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                <span>⭐</span>
                Favoritos
              </Link>

              <Link
                href="/arquivos/recentes"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                <span>🕘</span>
                Recentes
              </Link>

              <Link
                href="/arquivos/lixeira"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                <span>🗑️</span>
                Lixeira
              </Link>
            </nav>

            <div className="mt-auto border-t border-slate-800 pt-4">
              <div className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Armazenamento
              </div>

              <Link
                href="/armazenamento"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
              >
                <span>☁️</span>
                Providers
              </Link>

              <p className="px-4 text-[10px] text-slate-600">
                Nenhum conectado
              </p>
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto bg-slate-950">
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
                    Início
                  </p>

                  <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Meus arquivos
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Organize seus documentos e mídias.
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-500"
                >
                  + Nova pasta
                </button>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
                <button className="shrink-0 rounded-full bg-blue-600/15 px-4 py-2 text-xs font-semibold text-blue-300">
                  📁 Arquivos
                </button>

                <Link
                  href="/arquivos/favoritos"
                  className="shrink-0 rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-400"
                >
                  ⭐ Favoritos
                </Link>

                <Link
                  href="/arquivos/recentes"
                  className="shrink-0 rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-400"
                >
                  🕘 Recentes
                </Link>

                <Link
                  href="/arquivos/lixeira"
                  className="shrink-0 rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-400"
                >
                  🗑️ Lixeira
                </Link>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  Não foi possível carregar as pastas.
                </div>
              )}

              {!error && pastas.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center">
                  <div className="text-5xl">📂</div>

                  <h3 className="mt-4 text-lg font-semibold">
                    Nenhuma pasta encontrada
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Prepare sua conta para criar as pastas iniciais.
                  </p>
                </div>
              )}

              {!error && pastas.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {pastas.map((pasta) => (
                    <Link
                      key={pasta.id}
                      href={`/arquivos/${pasta.id}`}
                      className="group min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-3xl sm:text-4xl">
                          {icones[pasta.name] ?? "📁"}
                        </span>

                        <span className="text-slate-600 opacity-0 transition group-hover:opacity-100">
                          ⋯
                        </span>
                      </div>

                      <div className="mt-4 truncate text-sm font-semibold sm:text-base">
                        {pasta.name}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-600 sm:text-xs">
                        Pasta
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 text-[10px] text-slate-600 sm:px-6 sm:text-xs">
          <span>
            {pastas.length} {pastas.length === 1 ? "item" : "itens"}
          </span>

          <span>NasNuvemS • v0.1.0</span>
        </footer>
      </div>
    </main>
  );
}
