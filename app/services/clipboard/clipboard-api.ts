
export interface IClipboardServiceApi {
  copy(): void;
  paste(duplicateSources?: boolean): void;
  copyFilters(): void;
  pasteFilters(): void;
  hasData(): boolean;
  hasItems(): boolean;
  hasFilters(): boolean;
  clear(): void;
}
