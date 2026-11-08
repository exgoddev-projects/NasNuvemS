"use client";

import { useState, useTransition } from "react";
import { excluirPasta } from "@/app/arquivos/actions/folders";

export function DeleteFolderButton({
  folderId,
  folderName,
}: {
  folderId: string;
  folderName: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [pendente, iniciarTransicao] = useTransition();

  function excluir() {
    setErro("");

    iniciarTransicao(async () => {
      try {
        await excluirPasta(folderId);
        setAberto(false);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a pasta."
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Excluir ${folderName}`}
        title="Excluir pasta"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setAberto(true);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
      >
        🗑️
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
              ⚠️
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Excluir “{folderName}”?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Esta pasta, todas as subpastas e todo o conteúdo
              serão enviados para a lixeira.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Você poderá restaurar pela lixeira.
            </p>

            {erro && (
              <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {erro}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={pendente}
                onClick={() => setAberto(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={pendente}
                onClick={excluir}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {pendente ? "Excluindo..." : "Excluir tudo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
