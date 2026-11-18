export const instant = false;

import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { garantirPastasPadrao } from "@/lib/folders/default-folders";
import ExplorerStatusBar from "@/components/filesystem/explorer-status-bar";

type Folder = {
  id: string;
  name: string;
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

  // Conta nova: cria as pastas padrao no primeiro acesso.
  try {
    await garantirPastasPadrao(supabase, user.id);
  } catch {
    // Se falhar, a consulta abaixo mostra o erro normalmente.
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

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold"
              title={user.email ?? "Usuário"}
            >
              {(user.email?.[0] ?? "U").toUpperCase()}
            </div>
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto bg-slate-950">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
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
                  As pastas aparecerão na navegação quando estiverem disponíveis.
                </p>
              </div>
            )}
          </div>
        </section>

        <ExplorerStatusBar
          countText={`${pastas.length} ${pastas.length === 1 ? "pasta" : "pastas"}`}
        />
      </div>
    </main>
  );
}
