"use client";

import { FormEvent, useState, useTransition } from "react";
import { criarPasta } from "@/app/arquivos/actions/folders";

export function NewFolderButton({
  parentId,
}: {
  parentId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciarTransicao] = useTransition();

  function fechar() {
    if (pendente) return;

    setAberto(false);
    setNome("");
    setErro("");
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      setErro("Digite um nome para a pasta.");
      return;
    }

    setErro("");

    iniciarTransicao(async () => {
      try {
        await criarPasta(parentId, nomeLimpo);
        setNome("");
        setAberto(false);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível criar a pasta."
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
      >
        + Nova pasta
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar"
            onClick={fechar}
            className="absolute inset-0"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5">
              <div className="text-3xl">📁</div>

              <h2 className="mt-3 text-xl font-bold">
                Nova pasta
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Digite o nome da nova pasta.
              </p>
            </div>

            <form onSubmit={enviar}>
              <input
                autoFocus
                type="text"
                maxLength={100}
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: Trabalho"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              {erro && (
                <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {erro}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fechar}
                  disabled={pendente}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={pendente}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {pendente ? "Criando..." : "Criar pasta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
