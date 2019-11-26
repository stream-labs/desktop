export { default as Default } from './Default';

export class LayoutProps {
  resizeStartHandler: () => void = () => {};
  resizeStopHandler: () => void = () => {};
  resizes: { bar1: number; bar2: number } = null;
}
