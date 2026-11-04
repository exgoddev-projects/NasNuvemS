"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] =
    useState<"erro" | "sucesso" | "">("");

  async function entrar(event: FormEvent) {
    event.preventDefault();

    setCarregando(true);
    setMensagem("");
    setTipoMensagem("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setTipoMensagem("erro");
      setMensagem("Não foi possível entrar. Confira o e-mail e a senha.");
      setCarregando(false);
      return;
    }

    window.location.href = "/teste-supabase";
  }

  async function criarConta() {
    setMensagem("");
    setTipoMensagem("");

    if (!email || !senha) {
      setTipoMensagem("erro");
      setMensagem("Digite seu e-mail e uma senha para criar a conta.");
      return;
    }

    if (senha.length < 6) {
      setTipoMensagem("erro");
      setMensagem("A senha precisa ter pelo menos 6 caracteres.");
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
      setTipoMensagem("erro");
      setMensagem(error.message);
    } else {
      setTipoMensagem("sucesso");
      setMensagem(
        "Conta criada! Confira sua caixa de entrada para confirmar o e-mail."
      );
    }

    setCarregando(false);
  }

  async function recuperarSenha() {
    setMensagem("");
    setTipoMensagem("");

    if (!email) {
      setTipoMensagem("erro");
      setMensagem(
        "Digite seu e-mail acima para receber o link de recuperação."
      );
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      setTipoMensagem("erro");
      setMensagem("Não foi possível enviar o e-mail de recuperação.");
    } else {
      setTipoMensagem("sucesso");
      setMensagem(
        "Se existir uma conta com esse e-mail, enviaremos um link de recuperação."
      );
    }

    setCarregando(false);
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid h-full w-full grid-rows-[64px_minmax(0,1fr)_52px] sm:grid-rows-[72px_minmax(0,1fr)_56px]">

        <header className="flex items-center justify-between border-b border-slate-900/60 px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl shadow-lg shadow-blue-600/20 sm:h-11 sm:w-11">
              ☁
            </div>

            <div>
              <div className="text-sm font-bold tracking-tight sm:text-base">
                NasNuvemS
              </div>

              <div className="text-[10px] text-slate-500 sm:text-xs">
                NAS pessoal na nuvem
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Online
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="flex min-h-full items-center justify-center px-4 py-5 sm:px-8 sm:py-8 lg:px-12">

            <section className="mx-auto w-full max-w-[440px] sm:max-w-[520px] lg:max-w-[580px] xl:max-w-[620px]">

              <div className="mb-5 text-center sm:mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10 text-2xl shadow-xl shadow-blue-950/40 sm:h-16 sm:w-16 sm:text-3xl">
                  ☁
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  Bem-vindo ao NasNuvemS
                </h1>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
                  Acesse seu espaço pessoal na nuvem com segurança,
                  de qualquer lugar.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7 lg:p-8">

                <form onSubmit={entrar} className="space-y-4 sm:space-y-5">
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
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="voce@email.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 sm:py-3.5 sm:text-base"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label
                        htmlFor="senha"
                        className="text-sm font-medium text-slate-200"
                      >
                        Senha
                      </label>

                      <button
                        type="button"
                        onClick={recuperarSenha}
                        disabled={carregando}
                        className="text-xs font-medium text-blue-400 transition hover:text-blue-300 disabled:opacity-50"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="senha"
                        type={mostrarSenha ? "text" : "password"}
                        required
                        minLength={6}
                        autoComplete="current-password"
                        value={senha}
                        onChange={(event) => setSenha(event.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-4 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 sm:py-3.5 sm:text-base"
                      />

                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 transition hover:text-white"
                      >
                        {mostrarSenha ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>

                  {mensagem && (
                    <div
                      className={`rounded-xl border p-3 text-sm leading-5 ${
                        tipoMensagem === "sucesso"
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
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
                  >
                    {carregando ? "Aguarde..." : "Entrar"}
                  </button>
                </form>

                <div className="my-4 flex items-center gap-4 sm:my-5">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="whitespace-nowrap text-[10px] text-slate-500 sm:text-xs">
                    NOVO POR AQUI?
                  </span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={criarConta}
                  disabled={carregando}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-semibold transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50 sm:py-3.5"
                >
                  Criar minha conta
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500 sm:mt-5 sm:text-xs">
                  <span>🔒</span>
                  <span>Conexão protegida</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex items-center justify-center border-t border-slate-900/70 bg-[#020617]/95 px-4 text-center backdrop-blur">
          <div className="leading-tight">
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
