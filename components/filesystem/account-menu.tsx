"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccountMenuProps = {
  email: string | null;
};

export default function AccountMenu({ email }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resetStatus, setResetStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [signOutStatus, setSignOutStatus] = useState<
    "idle" | "signing-out" | "error"
  >("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  async function solicitarRedefinicao() {
    if (!email) {
      setResetStatus("error");
      return;
    }

    setResetStatus("sending");

    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/redefinir-senha`,
    });

    setResetStatus(error ? "error" : "success");
  }

  async function sair() {
    setSignOutStatus("signing-out");

    try {
      const { error } = await createClient().auth.signOut();

      if (error) {
        setSignOutStatus("error");
        return;
      }

      window.location.replace("/login");
    } catch {
      setSignOutStatus("error");
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Menu da conta"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title={email ?? "Usuário"}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      >
        {(email?.[0] ?? "U").toUpperCase()}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Menu da conta"
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-white">Minha conta</p>
            <p className="truncate text-xs text-slate-400" title={email ?? undefined}>
              {email ?? "E-mail não disponível"}
            </p>
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={solicitarRedefinicao}
              disabled={resetStatus === "sending"}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true">🔑</span>Redefinir senha
            </button>
            {resetStatus === "success" && (
              <p role="status" className="px-3 py-2 text-xs text-emerald-300">
                Se a conta puder receber e-mails, enviaremos um link para redefinir a senha.
              </p>
            )}
            {resetStatus === "error" && (
              <p role="alert" className="px-3 py-2 text-xs text-red-300">
                Não foi possível enviar o e-mail de redefinição.
              </p>
            )}
            <button type="button" role="menuitem" disabled className="flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 disabled:opacity-100">
              <span aria-hidden="true">⚙️</span>Configurações
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={sair}
              disabled={signOutStatus === "signing-out"}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
            >
              <span aria-hidden="true">🚪</span>
              {signOutStatus === "signing-out" ? "Saindo..." : "Sair"}
            </button>
            {signOutStatus === "error" && (
              <p role="alert" className="px-3 py-2 text-xs text-red-300">
                Não foi possível encerrar a sessão. Tente novamente.
              </p>
            )}
          </div>

          <div role="separator" className="my-1 border-t border-slate-800" />

          <div className="py-1">
            <button type="button" role="menuitem" disabled className="flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-rose-300 disabled:opacity-100">
              <span aria-hidden="true">🗑️</span>Excluir minha conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
