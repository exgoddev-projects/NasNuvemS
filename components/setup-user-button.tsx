"use client";

import { useState } from "react";

export function SetupUserButton() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function configurar() {
    setCarregando(true);
    setMensagem("");

    try {
      const resposta = await fetch("/api/setup-user", {
        method: "POST",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(
          dados.error ?? "Erro ao configurar usuario."
        );
        return;
      }

      setMensagem(
        "Pastas iniciais criadas com sucesso."
      );
    } catch {
      setMensagem(
        "Nao foi possivel concluir a configuracao."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={configurar}
        disabled={carregando}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        {carregando
          ? "Configurando..."
          : "Preparar meu NasNuvemS"}
      </button>

      {mensagem && (
        <p className="mt-3 text-sm text-slate-300">
          {mensagem}
        </p>
      )}
    </div>
  );
}
