
export interface IClipboardServiceApi {
  copy(): void;
  paste(duplicateSources?: boolean): void;
  copyFilters(): void;
  pasteFilters(toSourceId: string): void;
  hasItems(): boolean;
  hasFilters(): boolean;
  clear(): void;
}
