import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import ExplorerShell from "@/components/filesystem/explorer-shell";
import { carregarPastasNavegacao } from "@/lib/folders/explorer-navigation";
import { createClient } from "@/lib/supabase/server";

type ArquivosLayoutProps = {
  children: ReactNode;
};

export default async function ArquivosLayout({
  children,
}: ArquivosLayoutProps) {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { folders, rootFolders } = await carregarPastasNavegacao(
    supabase,
    user.id
  );

  return (
    <ExplorerShell folders={folders} rootFolders={rootFolders}>
      {children}
    </ExplorerShell>
  );
}
