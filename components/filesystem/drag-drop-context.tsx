"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { moverPastas } from "@/app/arquivos/actions/folders";

const DRAG_MIME = "application/x-nasnuvems-item";

type DragItem =
  | { type: "file"; id: string }
  | { type: "folder"; id: string };

type FolderDestination = {
  id: string;
  name: string;
  parent_id: string | null;
};

type SelectionGroup = "files" | "folders";

type DragDropContextValue = {
  draggedItem: DragItem | null;
  hoveredFolderId: string | null;
  moving: boolean;
  selectionMode: boolean;
  setSelectionMode: (group: SelectionGroup, active: boolean) => void;
  isValidDropTarget: (destinationId: string) => boolean;
  onDragStart: (event: DragEvent<HTMLElement>, item: DragItem) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>, destinationId: string) => void;
  onDragLeave: (event: DragEvent<HTMLElement>, destinationId: string) => void;
  onDrop: (event: DragEvent<HTMLElement>, destinationId: string) => Promise<void>;
};

const DragDropContext = createContext<DragDropContextValue | null>(null);

function parseDragItem(value: string): DragItem | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (
      (candidate.type === "file" || candidate.type === "folder") &&
      typeof candidate.id === "string" &&
      candidate.id.length > 0
    ) {
      return { type: candidate.type, id: candidate.id };
    }
  } catch {
    return null;
  }

  return null;
}

function sameItem(left: DragItem, right: DragItem) {
  return left.type === right.type && left.id === right.id;
}

export function DragDropProvider({
  children,
  destinations,
  currentFolderId,
}: {
  children: ReactNode;
  destinations: FolderDestination[];
  currentFolderId: string;
}) {
  const router = useRouter();
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [selectionModes, setSelectionModes] = useState<Set<SelectionGroup>>(
    () => new Set()
  );
  const [announcement, setAnnouncement] = useState("");
  const draggedItemRef = useRef<DragItem | null>(null);
  const destinationsById = new Map(
    destinations.map((destination) => [destination.id, destination])
  );
  const selectionMode = selectionModes.size > 0;
  const setSelectionMode = useCallback(
    (group: SelectionGroup, active: boolean) => {
      setSelectionModes((current) => {
        if (current.has(group) === active) {
          return current;
        }

        const next = new Set(current);

        if (active) {
          next.add(group);
        } else {
          next.delete(group);
        }

        return next;
      });
    },
    []
  );

  function isValidDropTarget(destinationId: string) {
    const item = draggedItemRef.current;

    if (
      !item ||
      moving ||
      selectionMode ||
      destinationId === currentFolderId ||
      !destinationsById.has(destinationId)
    ) {
      return false;
    }

    if (item.type === "file") {
      return true;
    }

    const visited = new Set<string>();
    let current = destinationsById.get(destinationId);

    while (current) {
      if (current.id === item.id || visited.has(current.id)) {
        return false;
      }

      visited.add(current.id);
      current = current.parent_id
        ? destinationsById.get(current.parent_id)
        : undefined;
    }

    return destinationsById.has(item.id);
  }

  function clearDrag() {
    draggedItemRef.current = null;
    setDraggedItem(null);
    setHoveredFolderId(null);
  }

  function onDragStart(event: DragEvent<HTMLElement>, item: DragItem) {
    if (moving || selectionMode) {
      event.preventDefault();
      return;
    }

    draggedItemRef.current = item;
    setDraggedItem(item);
    setAnnouncement("Arrastando item. Solte sobre uma pasta válida para movê-lo.");
    event.dataTransfer.clearData();
    event.dataTransfer.setData(DRAG_MIME, JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    clearDrag();
    setAnnouncement((current) =>
      current.startsWith("Arrastando item.") ? "" : current
    );
  }

  function onDragOver(event: DragEvent<HTMLElement>, destinationId: string) {
    if (!isValidDropTarget(destinationId)) {
      event.dataTransfer.dropEffect = "none";
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setHoveredFolderId(destinationId);
  }

  function onDragLeave(event: DragEvent<HTMLElement>, destinationId: string) {
    const relatedTarget = event.relatedTarget;

    if (
      relatedTarget instanceof Node &&
      event.currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    setHoveredFolderId((current) =>
      current === destinationId ? null : current
    );
  }

  async function onDrop(
    event: DragEvent<HTMLElement>,
    destinationId: string
  ) {
    event.preventDefault();

    const payload = parseDragItem(event.dataTransfer.getData(DRAG_MIME));
    const activeItem = draggedItemRef.current;

    if (
      !payload ||
      !activeItem ||
      !sameItem(payload, activeItem) ||
      !isValidDropTarget(destinationId)
    ) {
      setAnnouncement("Movimentação rejeitada. O item ou destino não é válido.");
      clearDrag();
      return;
    }

    const destination = destinationsById.get(destinationId);

    if (!destination) {
      setAnnouncement("Movimentação rejeitada. Pasta de destino não encontrada.");
      clearDrag();
      return;
    }

    setMoving(true);
    setAnnouncement(`Movendo item para ${destination.name}...`);
    setHoveredFolderId(null);

    try {
      if (payload.type === "file") {
        const response = await fetch("/api/files/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: [payload.id],
            destinationId,
          }),
        });
        const result: unknown = await response.json();
        const errorMessage =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Não foi possível mover o arquivo.";

        if (!response.ok) {
          throw new Error(errorMessage);
        }
      } else {
        await moverPastas([payload.id], destinationId);
      }

      setAnnouncement(`Item movido para ${destination.name}.`);
      router.refresh();
    } catch (error) {
      setAnnouncement(
        error instanceof Error
          ? `Erro ao mover item: ${error.message}`
          : "Erro ao mover item."
      );
    } finally {
      setMoving(false);
      clearDrag();
    }
  }

  return (
    <DragDropContext.Provider
      value={{
        draggedItem,
        hoveredFolderId,
        moving,
        selectionMode,
        setSelectionMode,
        isValidDropTarget,
        onDragStart,
        onDragEnd,
        onDragOver,
        onDragLeave,
        onDrop,
      }}
    >
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          announcement
            ? "fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white shadow-xl"
            : "sr-only"
        }
      >
        {announcement}
      </div>
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);

  if (!context) {
    throw new Error("useDragDrop deve ser usado dentro de DragDropProvider.");
  }

  return context;
}

export function useOptionalDragDrop() {
  return useContext(DragDropContext);
}
