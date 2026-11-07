"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

type UploadItem = {
  name: string;
  status: "enviando" | "concluido" | "erro";
  error?: string;
};

export function UploadButton({
  folderId,
}: {
  folderId: string;
}) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [enviando, setEnviando] =
    useState(false);

  const [uploads, setUploads] =
    useState<UploadItem[]>([]);

  async function enviarArquivo(file: File) {
    setUploads((atual) => [
      ...atual,
      {
        name: file.name,
        status: "enviando",
      },
    ]);

    try {
      const authResponse = await fetch(
        "/api/storage/b2/upload-url",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            folderId,
            fileName: file.name,
            contentType:
              file.type ||
              "application/octet-stream",
          }),
        }
      );

      const authData =
        await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(
          authData.error ||
            "Nao foi possivel preparar o upload."
        );
      }

      const uploadResponse = await fetch(
        authData.uploadUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              file.type ||
              "application/octet-stream",
          },
          body: file,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(
          `Falha no upload: ${uploadResponse.status}`
        );
      }

      const versionId =
        uploadResponse.headers.get(
          "x-amz-version-id"
        );

      if (!versionId) {
        throw new Error(
          "O storage nao informou a versao do arquivo."
        );
      }

      const completeResponse = await fetch(
        "/api/files/complete-upload",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            folderId,
            name: file.name,
            mimeType:
              file.type ||
              "application/octet-stream",
            sizeBytes: file.size,
            objectKey:
              authData.objectKey,
            versionId,
          }),
        }
      );

      const completeData =
        await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(
          completeData.error ||
            "Upload realizado, mas nao foi possivel registrar o arquivo."
        );
      }

      setUploads((atual) =>
        atual.map((item) =>
          item.name === file.name &&
          item.status === "enviando"
            ? {
                ...item,
                status: "concluido",
              }
            : item
        )
      );
    } catch (error) {
      setUploads((atual) =>
        atual.map((item) =>
          item.name === file.name &&
          item.status === "enviando"
            ? {
                ...item,
                status: "erro",
                error:
                  error instanceof Error
                    ? error.message
                    : "Erro no upload.",
              }
            : item
        )
      );
    }
  }

  async function selecionar(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length === 0) {
      return;
    }

    setEnviando(true);

    for (const file of files) {
      await enviarArquivo(file);
    }

    setEnviando(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={selecionar}
        className="hidden"
      />

      <button
        type="button"
        disabled={enviando}
        onClick={() =>
          inputRef.current?.click()
        }
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
      >
        {enviando
          ? "Enviando..."
          : "📤 Enviar arquivos"}
      </button>

      {uploads.length > 0 && (
        <div className="fixed bottom-14 right-3 z-50 w-[calc(100%-24px)] max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">
              Uploads
            </span>

            {!enviando && (
              <button
                type="button"
                onClick={() =>
                  setUploads([])
                }
                className="text-xs text-slate-500"
              >
                Fechar
              </button>
            )}
          </div>

          <div className="max-h-52 space-y-2 overflow-y-auto">
            {uploads.map(
              (item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="rounded-xl bg-slate-950 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span>
                      {item.status ===
                      "concluido"
                        ? "✅"
                        : item.status ===
                            "erro"
                          ? "❌"
                          : "☁️"}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-xs">
                      {item.name}
                    </span>
                  </div>

                  {item.error && (
                    <p className="mt-2 text-[10px] text-red-400">
                      {item.error}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
