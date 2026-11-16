"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import {
  useDragDrop,
  type DragSelectionItem,
} from "@/components/filesystem/drag-drop-context";

type Props = {
  children: ReactNode;
  items: DragSelectionItem[];
};

type PositionedItem = {
  item: DragSelectionItem;
  top: number;
  bottom: number;
  left: number;
  domIndex: number;
};

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  additive: boolean;
  moved: boolean;
  initialSelection: DragSelectionItem[];
};

type SelectionRectangle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function itemKey(item: Pick<DragSelectionItem, "type" | "id">) {
  return `${item.type}:${item.id}`;
}

function getVisualOrder(
  root: HTMLElement,
  itemsByKey: Map<string, DragSelectionItem>
) {
  const positioned: PositionedItem[] = [];

  root
    .querySelectorAll<HTMLElement>("[data-selection-item]")
    .forEach((element, domIndex) => {
      const type = element.dataset.selectionType;
      const id = element.dataset.selectionId;

      if ((type !== "file" && type !== "folder") || !id) return;

      const item = itemsByKey.get(`${type}:${id}`);
      if (!item) return;

      const rect = element.getBoundingClientRect();
      positioned.push({
        item,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        domIndex,
      });
    });

  positioned.sort(
    (a, b) => a.top - b.top || a.left - b.left || a.domIndex - b.domIndex
  );

  const rows: PositionedItem[][] = [];
  for (const candidate of positioned) {
    const row = rows.find((entries) =>
      entries.some(
        (entry) => candidate.top < entry.bottom && candidate.bottom > entry.top
      )
    );

    if (row) row.push(candidate);
    else rows.push([candidate]);
  }

  return rows
    .sort(
      (a, b) =>
        Math.min(...a.map((item) => item.top)) -
        Math.min(...b.map((item) => item.top))
    )
    .flatMap((row) =>
      row
        .sort((a, b) => a.left - b.left || a.domIndex - b.domIndex)
        .map(({ item }) => item)
    );
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.matches(
        "input, textarea, select, [contenteditable]:not([contenteditable='false'])"
      ))
  );
}

export function DesktopSelectionSurface({ children, items }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const [rectangle, setRectangle] = useState<SelectionRectangle | null>(null);
  const {
    selectedItems,
    setSelectedItems,
    selectionAnchor,
    setSelectionAnchor,
  } = useDragDrop();

  const itemsByKey = new Map(items.map((item) => [itemKey(item), item]));

  useEffect(
    () => () => {
      const gesture = gestureRef.current;
      const root = rootRef.current;

      if (gesture && root?.hasPointerCapture(gesture.pointerId)) {
        root.releasePointerCapture(gesture.pointerId);
      }

      gestureRef.current = null;
    },
    []
  );

  function cardFromTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return null;
    const card = target.closest<HTMLElement>("[data-selection-item]");
    return card && rootRef.current?.contains(card) ? card : null;
  }

  function handleModifiedClick(event: SyntheticEvent<HTMLDivElement>) {
    const mouseEvent = event.nativeEvent;
    if (
      !(mouseEvent instanceof MouseEvent) ||
      (!mouseEvent.ctrlKey && !mouseEvent.shiftKey)
    ) {
      return;
    }

    const target = event.target;
    if (target instanceof Element && target.closest("[data-selection-ignore]")) {
      return;
    }

    const card = cardFromTarget(target);
    const type = card?.dataset.selectionType;
    const id = card?.dataset.selectionId;
    if (!card || (type !== "file" && type !== "folder") || !id) return;

    const currentItem = itemsByKey.get(`${type}:${id}`);
    if (!currentItem) return;

    event.preventDefault();
    event.stopPropagation();

    const visualOrder = rootRef.current
      ? getVisualOrder(rootRef.current, itemsByKey)
      : items;

    if (mouseEvent.shiftKey) {
      const anchorKey = selectionAnchor
        ? itemKey(selectionAnchor)
        : itemKey(currentItem);
      const anchorIndex = visualOrder.findIndex(
        (item) => itemKey(item) === anchorKey
      );
      const currentIndex = visualOrder.findIndex(
        (item) => itemKey(item) === itemKey(currentItem)
      );
      const range =
        anchorIndex < 0 || currentIndex < 0
          ? [currentItem]
          : visualOrder.slice(
              Math.min(anchorIndex, currentIndex),
              Math.max(anchorIndex, currentIndex) + 1
            );
      const next = mouseEvent.ctrlKey
        ? new Map(
            [...selectedItems, ...range].map((item) => [itemKey(item), item])
          )
        : new Map(range.map((item) => [itemKey(item), item]));

      setSelectedItems(
        visualOrder.filter((item) => next.has(itemKey(item)))
      );
      if (!selectionAnchor) setSelectionAnchor(currentItem);
      return;
    }

    const next = new Map(
      selectedItems.map((item) => [itemKey(item), item])
    );
    if (next.has(itemKey(currentItem))) next.delete(itemKey(currentItem));
    else next.set(itemKey(currentItem), currentItem);
    setSelectedItems(
      visualOrder.filter((item) => next.has(itemKey(item)))
    );
    setSelectionAnchor(currentItem);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      !event.ctrlKey ||
      event.key.toLowerCase() !== "a" ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    event.preventDefault();
    setSelectedItems(items);
    setSelectionAnchor(items[0] ?? null);
  }

  function beginRectangle(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !event.isPrimary || event.button !== 0) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest(
        "[data-selection-item], button, a, input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='menu'], [role='dialog'], [data-selection-ignore]"
      )
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      additive: event.ctrlKey,
      moved: false,
      initialSelection: event.ctrlKey ? selectedItems : [],
    };
  }

  function moveRectangle(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    const root = rootRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || !root) return;

    const left = Math.min(gesture.startX, event.clientX);
    const top = Math.min(gesture.startY, event.clientY);
    const right = Math.max(gesture.startX, event.clientX);
    const bottom = Math.max(gesture.startY, event.clientY);

    if (
      !gesture.moved &&
      Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 4
    ) {
      return;
    }

    gesture.moved = true;
    event.preventDefault();
    setRectangle({ left, top, width: right - left, height: bottom - top });

    const hits = new Set<string>();
    root.querySelectorAll<HTMLElement>("[data-selection-item]").forEach((element) => {
      const type = element.dataset.selectionType;
      const id = element.dataset.selectionId;
      if ((type !== "file" && type !== "folder") || !id) return;

      const rect = element.getBoundingClientRect();
      if (
        rect.left <= right &&
        rect.right >= left &&
        rect.top <= bottom &&
        rect.bottom >= top
      ) {
        hits.add(`${type}:${id}`);
      }
    });

    const next = new Map(
      [
        ...gesture.initialSelection,
        ...items.filter((item) => hits.has(itemKey(item))),
      ].map((item) => [itemKey(item), item])
    );
    const visualOrder = getVisualOrder(root, itemsByKey);
    const selected = visualOrder.filter((item) => next.has(itemKey(item)));
    setSelectedItems(selected);
    if (selected.length > 0) {
      setSelectionAnchor(selected[selected.length - 1]);
    } else {
      setSelectionAnchor(null);
    }
  }

  function endRectangle(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (!gesture.moved) {
      setSelectedItems([]);
      setSelectionAnchor(null);
    }

    gestureRef.current = null;
    setRectangle(null);
  }

  function cancelRectangle(event: PointerEvent<HTMLDivElement>) {
    if (gestureRef.current?.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    setRectangle(null);
  }

  return (
    <div
      ref={rootRef}
      className="relative min-w-0"
      tabIndex={0}
      onClickCapture={handleModifiedClick}
      onKeyDown={handleKeyDown}
      onPointerDown={beginRectangle}
      onPointerMove={moveRectangle}
      onPointerUp={endRectangle}
      onPointerCancel={cancelRectangle}
      onLostPointerCapture={cancelRectangle}
    >
      {children}
      {rectangle && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[80] border border-blue-400 bg-blue-500/15 shadow-[0_0_0_1px_rgba(15,23,42,0.65)]"
          style={{
            left: rectangle.left,
            top: rectangle.top,
            width: rectangle.width,
            height: rectangle.height,
          }}
        />
      )}
    </div>
  );
}
