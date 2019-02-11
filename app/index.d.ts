/// <reference path="../vendor/toasted.d.ts" />
/// <reference path="../vendor/urijs.d.ts" />
///<reference path="./jsx.d.ts"/>

// all global interfaces here

interface Dictionary<TItemType> {
  [key: string]: TItemType;
}

interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IScalableRectangle extends IRectangle {
  scaleX?: number;
  scaleY?: number;
  crop?: ICrop;
  rotation?: number;
}

declare type TPatch<TEntity> = { id: string } & Partial<TEntity>;

interface IVec2 {
  x: number;
  y: number;
}

interface ICrop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface IResource {
  resourceId: string;
}

interface IRGBColor {
  r: number;
  g: number;
  b: number;
}

// list of modules without type definitions
declare module 'raven-js/*';
declare module 'v-tooltip';
declare module 'traverse';
declare module 'vue-multiselect';
declare module 'unzip-stream';
declare module 'node-fontinfo';
declare module 'uuid/*';
declare module 'rimraf';
declare module '@xkeshi/vue-qrcode';
declare module 'vue-color';
declare module 'vue-popperjs';
declare module 'vue-slider-component';
declare module 'vuedraggable';
declare module 'font-manager';
declare module 'vue-codemirror';
declare module 'recursive-readdir';
declare module 'vue-toasted';
declare module 'hyperform';
declare module 'emojione';
declare module 'vue-resize';
declare module 'serve-handler';
declare module 'v-selectpage';
declare module '*.m.less';

// uncomment to allow TS to import components without type definitions
// webpack still checks the module existence

// declare module '*';
