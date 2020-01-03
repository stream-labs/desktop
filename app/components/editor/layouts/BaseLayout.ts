import TsxComponent from 'components/tsx-component';
import { Watch } from 'vue-property-decorator';
import { LayoutSlot } from 'services/layout';

export class LayoutProps {
  resizeStartHandler: () => void = () => {};
  resizeStopHandler: () => void = () => {};
  calculateMin: (slots: (LayoutSlot | LayoutSlot[])[]) => number = () => 0;
  calculateMax: (mins: number) => number = () => 0;
  setBarResize: (bar: 'bar1' | 'bar2', size: number, mins?: IResizeMins) => void = () => {};
  windowResizeHandler: (mins: IResizeMins, isChat?: boolean) => void = () => {};
  resizes: { bar1: number; bar2: number } = null;
  elWidth: number = 0;
}

export interface IResizeMins {
  bar1: number;
  bar2?: number;
  rest: number;
}

export default class BaseLayout extends TsxComponent<LayoutProps> {
  mountResize() {
    window.addEventListener('resize', () => this.props.windowResizeHandler(this.mins));
    window.addEventListener('maximize', () => this.props.windowResizeHandler(this.mins));
    window.addEventListener('unmaximize', () => this.props.windowResizeHandler(this.mins));
    this.props.windowResizeHandler(this.mins);
  }
  destroyResize() {
    window.removeEventListener('resize', () => this.props.windowResizeHandler(this.mins));
    window.removeEventListener('maximize', () => this.props.windowResizeHandler(this.mins));
    window.removeEventListener('unmaximize', () => this.props.windowResizeHandler(this.mins));
  }

  get totalWidth() {
    return this.props.elWidth;
  }

  @Watch('totalWidth')
  updateSize() {
    this.props.windowResizeHandler(this.mins, true);
  }

  get mins() {
    return { bar1: 0, rest: 0 };
  }
}
