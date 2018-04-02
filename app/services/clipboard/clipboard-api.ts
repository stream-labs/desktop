
export interface IClipboardServiceApi {
  copy(): void;
  pasteReference(): void;
  pasteDuplicate(): void;
  copyFilters(): void;
  pasteFilters(toSourceId: string): void;
  hasItems(): boolean;
  hasFilters(): boolean;
  clear(): void;
}
