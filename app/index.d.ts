// all global interfaces here

interface Dictionary<TItemType> {
  [key: string]: TItemType;
}

declare type TPatch<TEntity> = { id: string } & Partial<TEntity>;

// allow TS to import components without type definitions
// webpack still check the module existence
declare module '*';
