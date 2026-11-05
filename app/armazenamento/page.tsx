export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ArmazenamentoPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: providers } = await supabase
    .from("storage_providers")
    .select(
      "id, provider, display_name, enabled, is_default"
    )
    .eq("user_id", user.id)
    .order("created_at");

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      <div className="grid h-full grid-rows-[64px_minmax(0,1fr)_42px]">

        <header className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
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

              <h1 className="font-bold">
                Armazenamento
              </h1>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl">
            ☁
          </div>
        </header>

        <section className="min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                Storage Providers
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Seus armazenamentos
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Conecte serviços externos para armazenar
                documentos, fotos, vídeos, músicas e backups.
              </p>
            </div>

            <section>
              <h3 className="mb-4 text-sm font-semibold text-slate-300">
                Conectados
              </h3>

              {!providers || providers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
                  <div className="text-4xl">
                    ☁️
                  </div>

                  <h4 className="mt-4 font-semibold">
                    Nenhum provider conectado
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    Configure um armazenamento abaixo para
                    começar a enviar arquivos.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {provider.display_name}
                          </div>

                          <div className="mt-1 text-xs uppercase text-slate-500">
                            {provider.provider}
                          </div>
                        </div>

                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                          Conectado
                        </span>
                      </div>

                      {provider.is_default && (
                        <div className="mt-4 text-xs text-blue-400">
                          Armazenamento padrão
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h3 className="mb-4 text-sm font-semibold text-slate-300">
                Disponíveis
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">

                <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-2xl">
                      ☁️
                    </div>

                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                      Não configurado
                    </span>
                  </div>

                  <h4 className="mt-5 text-lg font-bold">
                    TeraBox
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Provider planejado para armazenamento
                    externo de arquivos e mídias.
                  </p>

                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
                  >
                    Aguardando configuração
                  </button>
                </article>

                <article className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
                    ＋
                  </div>

                  <h4 className="mt-5 text-lg font-bold">
                    Outros providers
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    A arquitetura está preparada para receber
                    novos provedores futuramente.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-lg bg-slate-950 px-3 py-2">
                      S3
                    </span>

                    <span className="rounded-lg bg-slate-950 px-3 py-2">
                      R2
                    </span>

                    <span className="rounded-lg bg-slate-950 px-3 py-2">
                      OneDrive
                    </span>

                    <span className="rounded-lg bg-slate-950 px-3 py-2">
                      SFTP
                    </span>
                  </div>
                </article>

              </div>
            </section>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-800 px-4 text-[10px] text-slate-600 sm:px-6 sm:text-xs">
          <span>
            {providers?.length ?? 0} conectado(s)
          </span>

          <span>NasNuvemS • v0.1.0</span>
        </footer>
      </div>
    </main>
  );
}
