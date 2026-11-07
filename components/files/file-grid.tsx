"use client";

import { useState } from "react";
import { FilePreview } from "@/components/files/file-preview";

type FileItem = {
  id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  previewUrl: string | null;
};

export function FileGrid({
  files,
  destinations,
  currentFolderId,
}: {
  files: FileItem[];
  destinations: Array<{
    id: string;
    name: string;
    parent_id: string | null;
  }>;
  currentFolderId: string;
}) {
  const [modoSelecao, setModoSelecao] =
    useState(false);

  const [selecionados, setSelecionados] =
    useState<Set<string>>(new Set());

  const [confirmando, setConfirmando] =
    useState(false);

  const [excluindo, setExcluindo] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [movendo, setMovendo] =
    useState(false);

  const [movendoArquivos, setMovendoArquivos] =
    useState(false);

  const [destinoId, setDestinoId] =
    useState("");

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
    if (
      files.length > 0 &&
      selecionados.size === files.length
    ) {
      setSelecionados(new Set());
      return;
    }

    setSelecionados(
      new Set(files.map((file) => file.id))
    );
  }

  function cancelar() {
    setSelecionados(new Set());
    setModoSelecao(false);
    setErro("");
  }

  function baixarSelecionados() {
    const ids = Array.from(selecionados);

    if (ids.length === 0) return;

    const form =
      document.createElement("form");

    form.method = "POST";
    form.action = "/api/files/download";
    form.style.display = "none";

    for (const id of ids) {
      const input =
        document.createElement("input");

      input.type = "hidden";
      input.name = "ids";
      input.value = id;

      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  async function moverSelecionados() {
    const ids = Array.from(selecionados);

    if (ids.length === 0 || !destinoId) {
      return;
    }

    setMovendoArquivos(true);
    setErro("");

    try {
      const response = await fetch(
        "/api/files/move",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ids,
            destinationId: destinoId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Nao foi possivel mover os arquivos."
        );
      }

      setMovendo(false);
      setDestinoId("");
      setSelecionados(new Set());
      setModoSelecao(false);

      window.location.reload();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao mover arquivos."
      );
    } finally {
      setMovendoArquivos(false);
    }
  }

  async function excluirSelecionados() {
    const ids = Array.from(selecionados);

    if (ids.length === 0) return;

    setExcluindo(true);
    setErro("");

    try {
      const response = await fetch(
        "/api/files/delete",
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
            "Nao foi possivel excluir os arquivos."
        );
      }

      setConfirmando(false);
      setSelecionados(new Set());
      setModoSelecao(false);

      window.location.reload();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao excluir arquivos."
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      {files.length > 0 && (
        <div className="col-span-full mb-1 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {modoSelecao
              ? `${selecionados.size} selecionado${
                  selecionados.size === 1
                    ? ""
                    : "s"
                }`
              : `${files.length} arquivo${
                  files.length === 1
                    ? ""
                    : "s"
                }`}
          </div>

          {!modoSelecao ? (
            <button
              type="button"
              onClick={() =>
                setModoSelecao(true)
              }
              className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900"
            >
              Selecionar arquivos
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selecionarTudo}
                className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300"
              >
                {selecionados.size ===
                files.length
                  ? "Desmarcar tudo"
                  : "Selecionar tudo"}
              </button>

              <button
                type="button"
                onClick={cancelar}
                className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {files.map((arquivo) => {
        const marcado =
          selecionados.has(arquivo.id);

        return (
          <div
            key={arquivo.id}
            className={`relative rounded-2xl border p-4 transition ${
              marcado
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            {modoSelecao && (
              <button
                type="button"
                aria-label={`Selecionar ${arquivo.name}`}
                onClick={() =>
                  alternar(arquivo.id)
                }
                className={`absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg border font-bold ${
                  marcado
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-600 bg-slate-950/90 text-transparent"
                }`}
              >
                ✓
              </button>
            )}

            {modoSelecao ? (
              <button
                type="button"
                onClick={() =>
                  alternar(arquivo.id)
                }
                className="block w-full text-left"
              >
                {arquivo.previewUrl ? (
                  <div className="aspect-square overflow-hidden rounded-xl bg-slate-950">
                    <img
                      src={arquivo.previewUrl}
                      alt={arquivo.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-950 text-4xl">
                    {arquivo.mime_type?.startsWith(
                      "video/"
                    )
                      ? "🎬"
                      : arquivo.mime_type?.startsWith(
                            "audio/"
                          )
                        ? "🎵"
                        : arquivo.mime_type ===
                            "application/pdf"
                          ? "📕"
                          : "📄"}
                  </div>
                )}
              </button>
            ) : arquivo.previewUrl ? (
              <FilePreview
                fileId={arquivo.id}
                name={arquivo.name}
                mimeType={arquivo.mime_type}
                sizeBytes={arquivo.size_bytes}
                previewUrl={
                  arquivo.previewUrl
                }
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-950 text-4xl">
                {arquivo.mime_type?.startsWith(
                  "video/"
                )
                  ? "🎬"
                  : arquivo.mime_type?.startsWith(
                        "audio/"
                      )
                    ? "🎵"
                    : arquivo.mime_type ===
                        "application/pdf"
                      ? "📕"
                      : "📄"}
              </div>
            )}

            <div className="mt-4 truncate font-semibold">
              {arquivo.name}
            </div>

            <div className="mt-1 text-xs text-slate-600">
              Arquivo
            </div>
          </div>
        );
      })}

      {modoSelecao &&
        selecionados.size > 0 && (
          <div className="fixed bottom-[42px] left-1/2 z-40 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-around gap-1">
              <button
                type="button"
                onClick={baixarSelecionados}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/10"
              >
                ⬇ Baixar
              </button>

              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setDestinoId("");
                  setMovendo(true);
                }}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                📂 Mover
              </button>

              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setConfirmando(true);
                }}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
              >
                🗑 Excluir
              </button>
            </div>
          </div>
        )}

      {movendo && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="text-3xl">
              📂
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Mover {selecionados.size}{" "}
              {selecionados.size === 1
                ? "arquivo"
                : "arquivos"}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Escolha a pasta de destino.
            </p>

            <div className="mt-5 max-h-72 space-y-2 overflow-y-auto">
              {destinations
                .filter(
                  (destination) =>
                    destination.id !==
                    currentFolderId
                )
                .map((destination) => (
                  <button
                    type="button"
                    key={destination.id}
                    onClick={() =>
                      setDestinoId(
                        destination.id
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      destinoId ===
                      destination.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-2xl">
                      📁
                    </span>

                    <span className="truncate text-sm font-semibold">
                      {destination.name}
                    </span>
                  </button>
                ))}
            </div>

            {erro && (
              <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {erro}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={movendoArquivos}
                onClick={() => {
                  setErro("");
                  setDestinoId("");
                  setMovendo(false);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  movendoArquivos ||
                  !destinoId
                }
                onClick={moverSelecionados}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
              >
                {movendoArquivos
                  ? "Movendo..."
                  : "Mover aqui"}
              </button>
            </div>
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
              Excluir {selecionados.size}{" "}
              {selecionados.size === 1
                ? "arquivo"
                : "arquivos"}?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Os arquivos selecionados serão
              removidos permanentemente do
              armazenamento.
            </p>

            <p className="mt-2 text-xs text-red-400">
              Esta ação não poderá ser desfeita.
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
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={excluindo}
                onClick={
                  excluirSelecionados
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {excluindo
                  ? "Excluindo..."
                  : `Excluir ${selecionados.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
