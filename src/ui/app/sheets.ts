import { signal } from '@preact/signals';
import type { ComponentChildren } from 'preact';

// GDD §9.1 "Sheets, not pages": details open as bottom sheets over the tab,
// which keeps its scroll position. A stack, so a breakdown can open over a sheet.
export interface SheetEntry {
  readonly id: number;
  readonly title: string;
  readonly render: () => ComponentChildren;
}

export const sheets = signal<readonly SheetEntry[]>([]);
let nextId = 1;

export const openSheet = (title: string, render: () => ComponentChildren): void => {
  sheets.value = [...sheets.value, { id: nextId++, title, render }];
};

export const closeSheet = (): void => {
  sheets.value = sheets.value.slice(0, -1);
};

export const closeAllSheets = (): void => {
  sheets.value = [];
};
