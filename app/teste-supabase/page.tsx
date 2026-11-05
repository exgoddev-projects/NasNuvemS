export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { SetupUserButton } from "@/components/setup-user-button";

export default async function TesteSupabasePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  const conectado =
    !error || error.message.toLowerCase().includes("session");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 text-5xl">☁️</div>

        <h1 className="text-3xl font-bold">NasNuvemS</h1>

        <p className="mt-2 text-slate-400">
          Teste de comunicação com o Supabase
        </p>

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <p className="text-lg font-semibold">
            {conectado
              ? "✅ Supabase configurado"
              : "❌ Não foi possível conectar"}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {data.user
              ? `Usuário conectado: ${data.user.email}`
              : "Nenhum usuário conectado ainda."}
          </p>

          {!conectado && (
            <p className="mt-3 text-sm text-red-400">
              {error?.message}
            </p>
          )}
        </div>

        {data.user && <SetupUserButton />}
      </section>
    </main>
  );
}
