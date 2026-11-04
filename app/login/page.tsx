"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setMensagem("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem(error.message);
      setCarregando(false);
      return;
    }

    window.location.href = "/teste-supabase";
  }

  async function criarConta() {
    setCarregando(true);
    setMensagem("");

    if (!email || !senha) {
      setMensagem("Preencha o e-mail e a senha.");
      setCarregando(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/teste-supabase`,
      },
    });

    if (error) {
      setMensagem(error.message);
    } else {
      setMensagem(
        "Conta criada. Confira seu e-mail para confirmar o cadastro."
      );
    }

    setCarregando(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="text-5xl">☁️</div>

        <h1 className="mt-5 text-3xl font-bold">
          NasNuvemS
        </h1>

        <p className="mt-2 text-slate-400">
          Entre no seu armazenamento pessoal
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-medium"
            >
              Senha
            </label>

            <input
              id="senha"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Sua senha"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {carregando ? "Aguarde..." : "Entrar"}
          </button>
        </form>

        <div className="my-6 h-px bg-slate-800" />

        <p className="mb-3 text-center text-sm text-slate-400">
          Ainda não tem uma conta?
        </p>

        <button
          type="button"
          onClick={criarConta}
          disabled={carregando}
          className="w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          Criar conta
        </button>

        {mensagem && (
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
            {mensagem}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          NasNuvemS • Seu NAS pessoal na nuvem
        </p>
      </section>
    </main>
  );
}
