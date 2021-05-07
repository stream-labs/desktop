declare module '*.m.less';
declare module 'rc-animate';
declare module 'react-dom';

interface Dictionary<TItemType> {
  [key: string]: TItemType;
}

interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IVec2 {
  x: number;
  y: number;
}
