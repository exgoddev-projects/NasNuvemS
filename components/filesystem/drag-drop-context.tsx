"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
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

export type DragSelectionItem = DragItem & {
  name: string;
  mimeType?: string | null;
  previewUrl?: string | null;
};

type DragPayload = {
  type: "file" | "folder";
  ids: string[];
};

type DragDropContextValue = {
  draggedItem: DragItem | null;
  hoveredFolderId: string | null;
  moving: boolean;
  selectionMode: boolean;
  selectedItems: DragSelectionItem[];
  setSelectedItems: (items: DragSelectionItem[]) => void;
  selectionAnchor: DragItem | null;
  setSelectionAnchor: (item: DragItem | null) => void;
  setSelectionMode: (group: SelectionGroup, active: boolean) => void;
  isValidDropTarget: (destinationId: string) => boolean;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    item: DragItem,
    visual: DragSelectionItem
  ) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>, destinationId: string) => void;
  onDragLeave: (event: DragEvent<HTMLElement>, destinationId: string) => void;
  onDrop: (event: DragEvent<HTMLElement>, destinationId: string) => Promise<void>;
};

const MAX_DRAG_ITEMS = 10;

const DragDropContext = createContext<DragDropContextValue | null>(null);

function parseDragPayload(value: string): DragPayload | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (
      (candidate.type === "file" || candidate.type === "folder") &&
      Array.isArray(candidate.ids)
    ) {
      const ids = candidate.ids.filter(
        (id): id is string => typeof id === "string" && id.length > 0
      );
      const uniqueIds = Array.from(new Set(ids));

      if (
        uniqueIds.length === candidate.ids.length &&
        uniqueIds.length > 0 &&
        uniqueIds.length <= MAX_DRAG_ITEMS
      ) {
        return { type: candidate.type, ids: uniqueIds };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function samePayload(left: DragPayload, right: DragPayload) {
  return (
    left.type === right.type &&
    left.ids.length === right.ids.length &&
    left.ids.every((id, index) => id === right.ids[index])
  );
}

function createDragPreview(
  items: DragSelectionItem[],
  total: number
): HTMLElement {
  const preview = document.createElement("div");
  Object.assign(preview.style, {
    position: "fixed",
    left: "0",
    top: "0",
    zIndex: "99999",
    width: "142px",
    height: "104px",
    pointerEvents: "none",
  });

  const visibleItems = items.slice(0, 3);

  visibleItems.forEach((item, index) => {
    const card = document.createElement("div");
    Object.assign(card.style, {
      position: "absolute",
      left: `${index * 9}px`,
      top: `${(visibleItems.length - index - 1) * 5}px`,
      zIndex: `${index + 1}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "3px",
      width: "76px",
      height: "90px",
      padding: "5px",
      overflow: "hidden",
      border: "1px solid #475569",
      borderRadius: "12px",
      background: "#0f172a",
      color: "#e2e8f0",
      boxShadow: "0 4px 12px rgba(0,0,0,.4)",
      font: "12px sans-serif",
      boxSizing: "border-box",
    });

    const thumbnail = document.createElement("div");
    Object.assign(thumbnail.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "62px",
      height: "62px",
      overflow: "hidden",
      borderRadius: "8px",
      background: "#020617",
      fontSize: "32px",
      flexShrink: "0",
    });

    if (item.type === "folder") {
      thumbnail.textContent = "📁";
    } else if (item.mimeType === "application/pdf") {
      thumbnail.textContent = "📕";
    } else if (item.mimeType?.startsWith("audio/")) {
      thumbnail.textContent = "🎵";
    } else if (item.previewUrl && item.mimeType?.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = item.previewUrl;
      video.muted = true;
      video.autoplay = false;
      video.controls = false;
      video.playsInline = true;
      video.preload = "metadata";
      video.pause();
      Object.assign(video.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      });
      thumbnail.appendChild(video);
    } else if (item.previewUrl) {
      const image = document.createElement("img");
      image.src = item.previewUrl;
      image.alt = "";
      Object.assign(image.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      });
      thumbnail.appendChild(image);
    } else {
      thumbnail.textContent = "📄";
    }

    const label = document.createElement("span");
    label.textContent = item.name;
    Object.assign(label.style, {
      display: "block",
      width: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      textAlign: "center",
      fontSize: "10px",
    });

    card.append(thumbnail, label);
    preview.appendChild(card);
  });

  if (total >= 3) {
    const badge = document.createElement("span");
    badge.textContent = String(total);
    Object.assign(badge.style, {
      position: "absolute",
      right: "0",
      bottom: "0",
      zIndex: "5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "28px",
      height: "28px",
      padding: "0 5px",
      border: "2px solid #0f172a",
      borderRadius: "9999px",
      background: "#2563eb",
      color: "#fff",
      font: "bold 13px sans-serif",
      boxSizing: "border-box",
    });
    preview.appendChild(badge);
  }

  return preview;
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
  const [selectedItems, setSelectedItemsState] = useState<DragSelectionItem[]>([]);
  const [selectionAnchor, setSelectionAnchor] = useState<DragItem | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const draggedPayloadRef = useRef<DragPayload | null>(null);
  const dragPreviewRef = useRef<HTMLElement | null>(null);
  const previewFrameRef = useRef<number | null>(null);
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

  const setSelectedItems = useCallback((items: DragSelectionItem[]) => {
    const unique = new Map<string, DragSelectionItem>();
    for (const item of items) unique.set(`${item.type}:${item.id}`, item);
    setSelectedItemsState(Array.from(unique.values()));
  }, []);

  function clearDragPreview() {
    if (previewFrameRef.current !== null) {
      window.cancelAnimationFrame(previewFrameRef.current);
      previewFrameRef.current = null;
    }

    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
  }

  useEffect(
    () => () => {
      clearDragPreview();
    },
    []
  );

  function isValidDropTarget(destinationId: string) {
    const payload = draggedPayloadRef.current;

    if (
      !payload ||
      moving ||
      destinationId === currentFolderId ||
      !destinationsById.has(destinationId)
    ) {
      return false;
    }

    if (payload.type === "file") {
      return true;
    }

    if (!payload.ids.every((id) => destinationsById.has(id))) {
      return false;
    }

    const selectedIds = new Set(payload.ids);
    const visited = new Set<string>();
    let current = destinationsById.get(destinationId);

    while (current) {
      if (selectedIds.has(current.id) || visited.has(current.id)) {
        return false;
      }

      visited.add(current.id);
      current = current.parent_id
        ? destinationsById.get(current.parent_id)
        : undefined;
    }

    return true;
  }

  function clearDrag() {
    draggedPayloadRef.current = null;
    setDraggedItem(null);
    setHoveredFolderId(null);
    clearDragPreview();
  }

  function onDragStart(
    event: DragEvent<HTMLElement>,
    item: DragItem,
    visual: DragSelectionItem
  ) {
    if (moving) {
      event.preventDefault();
      return;
    }

    const itemIsSelected = selectedItems.some(
      (selected) => selected.type === item.type && selected.id === item.id
    );

    if (
      itemIsSelected &&
      new Set(selectedItems.map((selected) => selected.type)).size > 1
    ) {
      event.preventDefault();
      clearDragPreview();
      setAnnouncement(
        "Para arrastar, selecione somente arquivos ou somente pastas."
      );
      return;
    }

    const items = itemIsSelected ? selectedItems : [visual];

    if (itemIsSelected && items.length > MAX_DRAG_ITEMS) {
      event.preventDefault();
      clearDragPreview();
      setAnnouncement("O limite para arrastar vários itens é 10.");
      return;
    }

    const ids = Array.from(new Set(items.map((selected) => selected.id)));
    if (ids.length === 0 || ids.length > MAX_DRAG_ITEMS) {
      event.preventDefault();
      clearDragPreview();
      return;
    }

    const payload: DragPayload = { type: item.type, ids };
    const previewItems = items.slice(0, 3);
    clearDragPreview();
    const preview = createDragPreview(previewItems, ids.length);
    document.body.appendChild(preview);
    dragPreviewRef.current = preview;

    try {
      event.dataTransfer.clearData();
      event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setDragImage(preview, 16, 16);
    } catch (error) {
      event.preventDefault();
      clearDrag();
      setAnnouncement(
        error instanceof Error
          ? `Não foi possível iniciar o arraste: ${error.message}`
          : "Não foi possível iniciar o arraste."
      );
      return;
    }

    draggedPayloadRef.current = payload;
    setDraggedItem(item);
    setAnnouncement(
      ids.length === 1
        ? "Arrastando item. Solte sobre uma pasta válida para movê-lo."
        : `Arrastando ${ids.length} itens. Solte sobre uma pasta válida para movê-los.`
    );
    previewFrameRef.current = window.requestAnimationFrame(() => {
      preview.remove();
      if (dragPreviewRef.current === preview) {
        dragPreviewRef.current = null;
      }
      previewFrameRef.current = null;
    });
  }

  function onDragEnd() {
    clearDrag();
    setAnnouncement((current) =>
      current.startsWith("Arrastando ") ? "" : current
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

    const payload = parseDragPayload(event.dataTransfer.getData(DRAG_MIME));
    const activePayload = draggedPayloadRef.current;

    if (
      !payload ||
      !activePayload ||
      !samePayload(payload, activePayload) ||
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
    setAnnouncement(
      `Movendo ${payload.ids.length === 1 ? "item" : `${payload.ids.length} itens`} para ${destination.name}...`
    );
    setHoveredFolderId(null);

    try {
      if (payload.type === "file") {
        const response = await fetch("/api/files/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: payload.ids,
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
        await moverPastas(payload.ids, destinationId);
      }

      setAnnouncement(
        `${payload.ids.length === 1 ? "Item movido" : `${payload.ids.length} itens movidos`} para ${destination.name}.`
      );
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
        selectedItems,
        setSelectedItems,
        selectionAnchor,
        setSelectionAnchor,
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
