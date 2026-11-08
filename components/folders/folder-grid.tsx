"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { renomearPasta, excluirPastas, moverPastas } from "@/app/arquivos/actions/folders";
import { caminhoDaPasta } from "@/components/folders/folder-path";

type Folder = {
  id: string;
  name: string;
};

export function FolderGrid({
  folders,
  destinations,
  currentFolderId,
}: {
  folders: Folder[];
  destinations: Array<{
    id: string;
    name: string;
    parent_id: string | null;
  }>;
  currentFolderId: string;
}) {
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(
    new Set()
  );
  const [renomeando, setRenomeando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] =
    useState(false);
  const [movendo, setMovendo] = useState(false);
  const [destinoId, setDestinoId] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState("");
  const [pendente, iniciarTransicao] = useTransition();

  function alternar(folderId: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(folderId)) {
        proximo.delete(folderId);
      } else {
        proximo.add(folderId);
      }

      return proximo;
    });
  }

  function cancelarSelecao() {
    setSelecionados(new Set());
    setModoSelecao(false);
  }

  function abrirRenomear() {
    if (selecionados.size !== 1) return;

    const id = Array.from(selecionados)[0];
    const pasta = folders.find((folder) => folder.id === id);

    if (!pasta) return;

    setNovoNome(pasta.name);
    setErro("");
    setRenomeando(true);
  }

  function confirmarRenomeacao() {
    if (selecionados.size !== 1) return;

    const id = Array.from(selecionados)[0];
    const nome = novoNome.trim();

    if (!nome) {
      setErro("Digite um nome para a pasta.");
      return;
    }

    setErro("");

    iniciarTransicao(async () => {
      try {
        await renomearPasta(id, nome);
        setRenomeando(false);
        setSelecionados(new Set());
        setModoSelecao(false);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Nao foi possivel renomear."
        );
      }
    });
  }

  function confirmarExclusaoSelecionados() {
    const ids = Array.from(selecionados);

    if (ids.length === 0) return;

    setErro("");

    iniciarTransicao(async () => {
      try {
        await excluirPastas(ids);

        setConfirmandoExclusao(false);
        setSelecionados(new Set());
        setModoSelecao(false);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Nao foi possivel excluir os itens."
        );
      }
    });
  }

  function confirmarMovimento() {
    const ids = Array.from(selecionados);

    if (ids.length === 0) return;

    if (!destinoId) {
      setErro("Escolha uma pasta de destino.");
      return;
    }

    setErro("");

    iniciarTransicao(async () => {
      try {
        await moverPastas(ids, destinoId);

        setMovendo(false);
        setDestinoId("");
        setSelecionados(new Set());
        setModoSelecao(false);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Nao foi possivel mover os itens."
        );
      }
    });
  }

  function selecionarTudo() {
    if (selecionados.size === folders.length) {
      setSelecionados(new Set());
      return;
    }

    setSelecionados(
      new Set(folders.map((folder) => folder.id))
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {modoSelecao
            ? `${selecionados.size} selecionado${
                selecionados.size === 1 ? "" : "s"
              }`
            : `${folders.length} pasta${
                folders.length === 1 ? "" : "s"
              }`}
        </div>

        {!modoSelecao ? (
          <button
            type="button"
            onClick={() => setModoSelecao(true)}
            className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            Selecionar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selecionarTudo}
              className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300"
            >
              {selecionados.size === folders.length
                ? "Desmarcar tudo"
                : "Selecionar tudo"}
            </button>

            <button
              type="button"
              onClick={cancelarSelecao}
              className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {folders.map((folder) => {
          const marcado = selecionados.has(folder.id);

          return (
            <div
              key={folder.id}
              className={`relative min-w-0 rounded-2xl border p-4 transition ${
                marcado
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              {modoSelecao && (
                <button
                  type="button"
                  aria-label={`Selecionar ${folder.name}`}
                  onClick={() => alternar(folder.id)}
                  className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${
                    marcado
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-700 bg-slate-950 text-transparent"
                  }`}
                >
                  ✓
                </button>
              )}

              {modoSelecao ? (
                <button
                  type="button"
                  onClick={() => alternar(folder.id)}
                  className="block w-full text-left"
                >
                  <div className="text-4xl">📁</div>

                  <div className="mt-4 truncate font-semibold">
                    {folder.name}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    Pasta
                  </div>
                </button>
              ) : (
                <Link
                  href={`/arquivos/${folder.id}`}
                  className="block"
                >
                  <div className="text-4xl">📁</div>

                  <div className="mt-4 truncate font-semibold">
                    {folder.name}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    Pasta
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {modoSelecao && selecionados.size > 0 && (
        <div className="fixed bottom-[42px] left-1/2 z-40 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-around gap-2">
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
              onClick={abrirRenomear}
              disabled={selecionados.size !== 1}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ✏️ Renomear
            </button>

            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
            >
              🗑 Excluir
            </button>
          </div>
        </div>
      )}
      {renomeando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => !pendente && setRenomeando(false)}
            className="absolute inset-0"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="text-3xl">✏️</div>

            <h2 className="mt-3 text-xl font-bold">
              Renomear pasta
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Digite o novo nome.
            </p>

            <input
              autoFocus
              type="text"
              maxLength={100}
              value={novoNome}
              onChange={(event) => setNovoNome(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  confirmarRenomeacao();
                }
              }}
              className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {erro && (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {erro}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={pendente}
                onClick={() => setRenomeando(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={pendente}
                onClick={confirmarRenomeacao}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {pendente ? "Renomeando..." : "Renomear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmandoExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() =>
              !pendente && setConfirmandoExclusao(false)
            }
            className="absolute inset-0"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
              ⚠️
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Excluir {selecionados.size}{" "}
              {selecionados.size === 1
                ? "pasta"
                : "pastas"}?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              As pastas selecionadas, suas subpastas e todo
              o conteúdo serão excluídos permanentemente.
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
                disabled={pendente}
                onClick={() =>
                  setConfirmandoExclusao(false)
                }
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={pendente}
                onClick={confirmarExclusaoSelecionados}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {pendente
                  ? "Excluindo..."
                  : `Excluir ${selecionados.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {movendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => !pendente && setMovendo(false)}
            className="absolute inset-0"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="text-3xl">📂</div>

            <h2 className="mt-3 text-xl font-bold">
              Mover {selecionados.size}{" "}
              {selecionados.size === 1
                ? "pasta"
                : "pastas"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Escolha a pasta de destino.
            </p>

            <div className="mt-5 max-h-72 space-y-2 overflow-y-auto">
              {destinations
                .filter(
                  (destination) =>
                    destination.id !== currentFolderId &&
                    !selecionados.has(destination.id)
                )
                .map((destination) => (
                  <button
                    type="button"
                    key={destination.id}
                    onClick={() =>
                      setDestinoId(destination.id)
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      destinoId === destination.id
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-2xl">📁</span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {destination.name}
                      </span>

                      <span className="block truncate text-xs text-slate-500">
                        {caminhoDaPasta(
                          destination.parent_id,
                          destinations
                        )}
                      </span>
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
                disabled={pendente}
                onClick={() => setMovendo(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={pendente || !destinoId}
                onClick={confirmarMovimento}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pendente ? "Movendo..." : "Mover aqui"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
