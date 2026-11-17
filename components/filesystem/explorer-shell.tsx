import type { ReactNode } from "react";
import type { ExplorerNavigationFolder } from "@/lib/folders/explorer-navigation";
import ExplorerSidebar from "@/components/filesystem/explorer-sidebar";
import styles from "@/components/filesystem/explorer-shell.module.css";

type ExplorerShellProps = {
  children: ReactNode;
  folders: ExplorerNavigationFolder[];
  rootFolders: ExplorerNavigationFolder[];
};

export default function ExplorerShell({
  children,
  folders,
  rootFolders,
}: ExplorerShellProps) {
  return (
    <div className={styles.shell}>
      <ExplorerSidebar folders={folders} rootFolders={rootFolders} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
