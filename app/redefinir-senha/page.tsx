"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const [supabase] = useState(() => createClient());
  const [estadoSessao, setEstadoSessao] = useState<
    "verificando" | "valida" | "invalida"
  >("verificando");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      const { data, error } = await supabase.auth.getUser();

      if (!ativo) return;

      setEstadoSessao(!error && data.user ? "valida" : "invalida");
    }

    void verificarSessao();

    return () => {
      ativo = false;
    };
  }, [supabase]);

  async function atualizarSenha(event: FormEvent) {
    event.preventDefault();
    setMensagem("");
    setSucesso(false);

    if (estadoSessao !== "valida") {
      setMensagem("Este link é inválido ou expirou. Solicite outro pelo login.");
      return;
    }

    if (senha.length < 6) {
      setMensagem("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não são iguais.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setMensagem("Não foi possível redefinir a senha. Solicite um novo link.");
    } else {
      setSucesso(true);
      setMensagem("Senha redefinida com sucesso.");
    }

    setCarregando(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-2xl font-bold">Redefinir senha</h1>
        <p className="mt-2 text-sm text-slate-400">
          Informe sua nova senha para acessar sua conta.
        </p>

        {estadoSessao === "verificando" ? (
          <p role="status" className="mt-6 text-sm text-slate-400">
            Validando o link de redefinição...
          </p>
        ) : estadoSessao === "invalida" ? (
          <div className="mt-6 space-y-4">
            <p role="alert" className="text-sm text-red-300">
              Este link é inválido ou expirou. Volte ao login para solicitar outro link.
            </p>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Voltar ao login
            </Link>
          </div>
        ) : sucesso ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="text-sm text-emerald-300">
              {mensagem}
            </p>
            <Link
              href="/arquivos"
              className="block text-center text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Voltar aos arquivos
            </Link>
          </div>
        ) : (
          <form onSubmit={atualizarSenha} className="mt-6 space-y-4">
            <div>
              <label htmlFor="nova-senha" className="mb-2 block text-sm font-medium">
                Nova senha
              </label>
              <input
                id="nova-senha"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmar-senha" className="mb-2 block text-sm font-medium">
                Confirmar senha
              </label>
              <input
                id="confirmar-senha"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {mensagem && (
              <p role="alert" className="text-sm text-red-300">
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-50"
            >
              {carregando ? "Aguarde..." : "Redefinir senha"}
            </button>
          </form>
        )}

        {estadoSessao === "valida" && !sucesso && (
          <Link
            href="/login"
            className="mt-4 block text-center text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Voltar ao login
          </Link>
        )}
      </section>
    </main>
  );
}
