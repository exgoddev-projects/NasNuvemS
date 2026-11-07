"use client";

import { useState } from "react";

type TrashFile = {
  id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  deleted_at: string | null;
  previewUrl: string | null;
};

export function TrashGrid({
  files,
}: {
  files: TrashFile[];
}) {
  const [selecionados, setSelecionados] =
    useState<Set<string>>(new Set());

  const [processando, setProcessando] =
    useState(false);

  const [confirmando, setConfirmando] =
    useState(false);

  const [erro, setErro] = useState("");

  function alternar(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(id)) {
        proximo.delete(id);
      } else {
        proximo.add(id);
      }

      return proximo;
    });
  }

  function selecionarTudo() {
    if (selecionados.size === files.length) {
      setSelecionados(new Set());
      return;
    }

    setSelecionados(
      new Set(files.map((file) => file.id))
    );
  }

  async function restaurar() {
    const ids = Array.from(selecionados);

    if (ids.length === 0) return;

    setProcessando(true);
    setErro("");

    try {
      const response = await fetch(
        "/api/files/restore",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ids,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Nao foi possivel restaurar."
        );
      }

      window.location.reload();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao restaurar."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function excluirDefinitivamente() {
    const ids = Array.from(selecionados);

    if (ids.length === 0) return;

    setProcessando(true);
    setErro("");

    try {
      const response = await fetch(
        "/api/files/delete-forever",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ids,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Nao foi possivel excluir definitivamente."
        );
      }

      setConfirmando(false);

      window.location.reload();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro na exclusao definitiva."
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {selecionados.size} selecionado
          {selecionados.size === 1 ? "" : "s"}
        </div>

        <button
          type="button"
          onClick={selecionarTudo}
          className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300"
        >
          {selecionados.size === files.length
            ? "Desmarcar tudo"
            : "Selecionar tudo"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {files.map((file) => {
          const marcado =
            selecionados.has(file.id);

          return (
            <button
              type="button"
              key={file.id}
              onClick={() =>
                alternar(file.id)
              }
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                marcado
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              <div
                className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border font-bold ${
                  marcado
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-600 bg-slate-950/90 text-transparent"
                }`}
              >
                ✓
              </div>

              {file.previewUrl ? (
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-950">
                  <img
                    src={file.previewUrl}
                    alt={file.name}
                    className="h-full w-full object-cover opacity-70"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-950 text-4xl opacity-70">
                  {file.mime_type?.startsWith(
                    "video/"
                  )
                    ? "🎬"
                    : file.mime_type?.startsWith(
                          "audio/"
                        )
                      ? "🎵"
                      : file.mime_type ===
                          "application/pdf"
                        ? "📕"
                        : "📄"}
                </div>
              )}

              <div className="mt-4 truncate text-sm font-semibold">
                {file.name}
              </div>

              <div className="mt-1 text-xs text-slate-600">
                Na lixeira
              </div>
            </button>
          );
        })}
      </div>

      {erro && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {selecionados.size > 0 && (
        <div className="fixed bottom-[42px] left-1/2 z-40 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-around gap-2">

            <button
              type="button"
              disabled={processando}
              onClick={() =>
                void restaurar()
              }
              className="rounded-xl px-4 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
            >
              ↩ Restaurar
            </button>

            <button
              type="button"
              disabled={processando}
              onClick={() => {
                setErro("");
                setConfirmando(true);
              }}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              🗑 Excluir definitivamente
            </button>

          </div>
        </div>
      )}

      {confirmando && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-6 text-white shadow-2xl">

            <div className="text-3xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Excluir definitivamente?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {selecionados.size}{" "}
              {selecionados.size === 1
                ? "arquivo sera removido"
                : "arquivos serao removidos"}{" "}
              permanentemente do armazenamento.
            </p>

            <p className="mt-2 text-xs text-red-400">
              Esta acao nao podera ser desfeita.
            </p>

            {erro && (
              <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {erro}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  setConfirmando(false)
                }
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  void excluirDefinitivamente()
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {processando
                  ? "Excluindo..."
                  : "Excluir definitivamente"}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
