"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function criarConta(event: FormEvent) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);

    if (senha.length < 6) {
      setMensagem("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não são iguais.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/teste-supabase`,
      },
    });

    if (error) {
      setMensagem(error.message);
      setCarregando(false);
      return;
    }

    setSucesso(true);
    setMensagem(
      "Conta criada! Confira seu e-mail para confirmar o cadastro."
    );
    setCarregando(false);
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid h-full grid-rows-[64px_minmax(0,1fr)_52px] sm:grid-rows-[72px_minmax(0,1fr)_56px]">

        <header className="flex items-center justify-between border-b border-slate-900/60 px-5 sm:px-8 lg:px-12">
          <Link href="/login" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-lg shadow-blue-600/20">
              ☁
            </div>

            <div>
              <div className="text-sm font-bold sm:text-base">
                NasNuvemS
              </div>
              <div className="text-[10px] text-slate-500 sm:text-xs">
                NAS pessoal na nuvem
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Online
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="flex min-h-full items-center justify-center px-4 py-5 sm:px-8 sm:py-8">

            <section className="mx-auto w-full max-w-[440px] sm:max-w-[520px] lg:max-w-[580px] xl:max-w-[620px]">

              <div className="mb-5 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10 text-2xl">
                  👤
                </div>

                <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                  Criar sua conta
                </h1>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400 sm:text-sm">
                  Crie seu acesso ao NasNuvemS.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7 lg:p-8">

                <form onSubmit={criarConta} className="space-y-4">

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-200"
                    >
                      E-mail
                    </label>

                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="senha"
                      className="mb-2 block text-sm font-medium text-slate-200"
                    >
                      Senha
                    </label>

                    <div className="relative">
                      <input
                        id="senha"
                        type={mostrarSenha ? "text" : "password"}
                        required
                        minLength={6}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-4 pr-20 text-white outline-none focus:border-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400"
                      >
                        {mostrarSenha ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmarSenha"
                      className="mb-2 block text-sm font-medium text-slate-200"
                    >
                      Confirmar senha
                    </label>

                    <input
                      id="confirmarSenha"
                      type={mostrarSenha ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Digite novamente"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {mensagem && (
                    <div
                      className={`rounded-xl border p-3 text-sm ${
                        sucesso
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-red-500/20 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {mensagem}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={carregando}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {carregando ? "Criando conta..." : "Criar conta"}
                  </button>

                </form>

                <div className="mt-5 text-center text-sm text-slate-400">
                  Já possui uma conta?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Entrar
                  </Link>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  🔒 Conta protegida pelo NasNuvemS
                </div>

              </div>
            </section>
          </div>
        </div>

        <footer className="flex items-center justify-center border-t border-slate-900/70 bg-[#020617]/95 px-4 text-center">
          <div>
            <div className="text-[10px] text-slate-500 sm:text-xs">
              NasNuvemS • v0.1.0
            </div>
            <div className="mt-1 hidden text-[10px] text-slate-700 sm:block">
              Seu espaço pessoal na nuvem
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
