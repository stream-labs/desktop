// all global interfaces here

interface Dictionary<TItemType> {
  [key: string]: TItemType
}

// allow TS to import components without type definitions
// webpack still check the module existence
declare module '*';
