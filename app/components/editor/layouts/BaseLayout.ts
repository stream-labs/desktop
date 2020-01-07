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
    if (this.bar1 < this.mins.bar1) this.props.setBarResize('bar1', this.mins.bar1);
    if (this.mins.bar2 && this.bar2 < this.mins.bar2) {
      this.props.setBarResize('bar2', this.mins.bar2);
    }
    this.props.windowResizeHandler(this.mins);
  }
  destroyResize() {
    window.removeEventListener('resize', () => this.props.windowResizeHandler(this.mins));
  }

  get totalWidth() {
    return this.props.elWidth;
  }

  @Watch('totalWidth')
  updateSize() {
    this.props.windowResizeHandler(this.mins, true);
  }

  get bar1(): number {
    return null;
  }
  get bar2(): number {
    return null;
  }
  get mins(): IResizeMins {
    return { bar1: 0, rest: 0 };
  }
}
