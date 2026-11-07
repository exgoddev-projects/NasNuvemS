"use client";

import { useState } from "react";

type Props = {
  fileId: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  previewUrl: string;
};

function formatSize(bytes: number | null) {
  if (bytes === null) return "";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

export function FilePreview({
  fileId,
  name,
  mimeType,
  sizeBytes,
  previewUrl,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [confirmando, setConfirmando] =
    useState(false);
  const [excluindo, setExcluindo] =
    useState(false);
  const [erro, setErro] = useState("");

  function baixar() {
    const form =
      document.createElement("form");

    form.method = "POST";
    form.action = "/api/files/download";
    form.style.display = "none";

    const input =
      document.createElement("input");

    input.type = "hidden";
    input.name = "ids";
    input.value = fileId;

    form.appendChild(input);
    document.body.appendChild(form);

    form.submit();
    form.remove();
  }

  async function excluir() {
    setExcluindo(true);
    setErro("");

    try {
      const response = await fetch(
        "/api/files/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: [fileId],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Nao foi possivel excluir o arquivo."
        );
      }

      setConfirmando(false);
      setAberto(false);

      window.location.reload();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao excluir arquivo."
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="block w-full text-left"
      >
        <div className="aspect-square overflow-hidden rounded-xl bg-slate-950">
          <img
            src={previewUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white">
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {name}
              </div>

              <div className="mt-0.5 text-xs text-slate-400">
                {mimeType ?? "Arquivo"}
                {sizeBytes !== null
                  ? ` • ${formatSize(sizeBytes)}`
                  : ""}
              </div>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setAberto(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl hover:bg-white/20"
            >
              ✕
            </button>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            <img
              src={previewUrl}
              alt={name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 p-4">
            <button
              type="button"
              onClick={baixar}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
            >
              ↓ Baixar
            </button>

            <button
              type="button"
              onClick={() => {
                setErro("");
                setConfirmando(true);
              }}
              className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10"
            >
              🗑 Excluir
            </button>
          </footer>
        </div>
      )}

      {confirmando && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="text-3xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Excluir arquivo?
            </h2>

            <p className="mt-3 break-words text-sm text-slate-300">
              {name}
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              O arquivo sera removido permanentemente
              do armazenamento.
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
                disabled={excluindo}
                onClick={() => {
                  setErro("");
                  setConfirmando(false);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={excluindo}
                onClick={excluir}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {excluindo
                  ? "Excluindo..."
                  : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
