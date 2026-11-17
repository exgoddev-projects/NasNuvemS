import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type FolderMetadata = {
  id: string;
  name: string;
  parent_id: string | null;
};

export type ExplorerNavigationFolder = FolderMetadata & {
  rootFolderId: string | null;
};

export async function carregarPastasNavegacao(
  supabase: SupabaseClient,
  authenticatedUserId: string
): Promise<{
  folders: ExplorerNavigationFolder[];
  rootFolders: ExplorerNavigationFolder[];
}> {
  const { data, error } = await supabase
    .from("folders")
    .select("id, name, parent_id")
    .eq("user_id", authenticatedUserId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar pastas de navegação: ${error.message}`);
  }

  const folders: FolderMetadata[] = data ?? [];
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
  const resolvedRootIds = new Map<string, string | null>();

  function findRootFolderId(folderId: string): string | null {
    const path: string[] = [];
    const visited = new Set<string>();
    let currentId: string | null = folderId;
    let rootFolderId: string | null = null;

    while (currentId !== null) {
      if (resolvedRootIds.has(currentId)) {
        rootFolderId = resolvedRootIds.get(currentId) ?? null;
        break;
      }

      const folder = foldersById.get(currentId);
      if (!folder || visited.has(currentId)) {
        rootFolderId = null;
        break;
      }

      visited.add(currentId);
      path.push(currentId);

      if (folder.parent_id === null) {
        rootFolderId = folder.id;
        break;
      }

      currentId = folder.parent_id;
    }

    for (const id of path) {
      resolvedRootIds.set(id, rootFolderId);
    }

    return rootFolderId;
  }

  const navigationFolders = folders.map((folder) => ({
    ...folder,
    rootFolderId: findRootFolderId(folder.id),
  }));

  return {
    folders: navigationFolders,
    rootFolders: navigationFolders.filter((folder) => folder.parent_id === null),
  };
}
