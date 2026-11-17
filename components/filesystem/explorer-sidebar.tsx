"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ExplorerNavigationFolder } from "@/lib/folders/explorer-navigation";

type ExplorerSidebarProps = {
  folders: ExplorerNavigationFolder[];
  rootFolders: ExplorerNavigationFolder[];
};

const rootFolderOrder = [
  "Backups",
  "Documentos",
  "Downloads",
  "Imagens",
  "Músicas",
  "Vídeos",
];

const secondaryLinks = [
  { href: "/armazenamento", label: "Providers", icon: "☁" },
  { href: "/arquivos/favoritos", label: "Favoritos", icon: "⭐" },
  { href: "/arquivos/recentes", label: "Recentes", icon: "🕘" },
  { href: "/arquivos/lixeira", label: "Lixeira", icon: "🗑" },
];

export default function ExplorerSidebar({
  folders,
  rootFolders,
}: ExplorerSidebarProps) {
  const pathname = usePathname();
  const [drawerPathname, setDrawerPathname] = useState<string | null>(null);
  const drawerOpen = drawerPathname === pathname;
  const currentFolderId = pathname.match(/^\/arquivos\/([^/]+)(?:\/|$)/)?.[1];
  const currentFolder = folders.find((folder) => folder.id === currentFolderId);
  const rootFolderOrderByName = new Map(
    rootFolderOrder.map((name, index) => [name, index])
  );
  const orderedRootFolders = [...rootFolders].sort(
    (a, b) =>
      (rootFolderOrderByName.get(a.name) ?? Number.MAX_SAFE_INTEGER) -
        (rootFolderOrderByName.get(b.name) ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
  );

  function renderLink(link: {
    href: string;
    label: string;
    icon: string;
    active?: boolean;
  }) {
    const active =
      link.active ??
      (pathname === link.href ||
        (link.href !== "/arquivos" &&
          pathname.startsWith(`${link.href}/`)));

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setDrawerPathname(null)}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          active
            ? "bg-blue-600/20 font-medium text-blue-300"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <span aria-hidden="true" className="w-5 text-center">
          {link.icon}
        </span>
        <span className="truncate">{link.label}</span>
      </Link>
    );
  }

  useEffect(() => {
    if (!drawerOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerPathname(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-white md:hidden"
        aria-label="Abrir navegação"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerPathname(pathname)}
      >
        ☰
      </button>

      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label="Fechar navegação"
          onClick={() => setDrawerPathname(null)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 -translate-x-full overflow-y-auto border-r border-slate-800 bg-slate-950 text-slate-200 transition-transform md:static md:z-auto md:translate-x-0 ${
          drawerOpen ? "translate-x-0" : ""
        }`}
        aria-label="Navegação do explorador"
      >
        <div className="border-b border-slate-800 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            NasNuvemS
          </p>
        </div>

        <nav className="space-y-1 p-3" aria-label="Principal">
          {renderLink({
            href: "/arquivos",
            label: "Meus arquivos",
            icon: "📁",
          })}
        </nav>

        <div className="px-5 pb-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pastas
          </p>
        </div>

        <nav className="space-y-1 px-3 pb-5" aria-label="Pastas principais">
          {orderedRootFolders.map((folder) =>
            renderLink({
              href: `/arquivos/${folder.id}`,
              label: folder.name,
              icon: "📁",
              active: currentFolder?.rootFolderId === folder.id,
            })
          )}
        </nav>

        <nav className="space-y-1 px-3 pb-5" aria-label="Outros locais">
          {secondaryLinks.map(renderLink)}
        </nav>
      </aside>
    </>
  );
}
