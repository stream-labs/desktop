// all global interfaces here

interface Dictionary<TItemType> {
  [key: string]: TItemType
}

declare module "vue-slider-component" {
  // currently we don't use any methods from vue-slider-component
  export = {};
}