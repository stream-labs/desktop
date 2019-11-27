import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

export class LayoutProps {
  resizeStartHandler: () => void = () => {};
  resizeStopHandler: () => void = () => {};
  reconcileHeightsWithinContraints: (mins: IResizeMins, isBar2Resize?: boolean) => void = () => {};
  setBarResize: (bar: 'bar1' | 'bar2', size: number) => void = () => {};
  resizes: { bar1: number; bar2: number } = null;
  maxHeight: number = null;
}

export interface IResizeMins {
  bar1: { absolute: number; reasonable: number };
  bar2: { absolute: number; reasonable: number };
}

const RESIZE_MINS = {
  bar1: { absolute: 32, reasonable: 156 },
  bar2: { absolute: 50, reasonable: 150 },
};

@Component({ props: createProps(LayoutProps) })
export default class extends TsxComponent<LayoutProps> {
  mounted() {
    this.props.reconcileHeightsWithinContraints(RESIZE_MINS);
    window.addEventListener('resize', this.windowResizeHandler);
  }
  destroyed() {
    window.removeEventListener('resize', this.windowResizeHandler);
  }

  windowResizeHandler() {
    this.props.reconcileHeightsWithinContraints(RESIZE_MINS);
  }

  get bar1() {
    return this.props.resizes.bar1;
  }
  set bar1(size: number) {
    if (size === 0) return;
    this.props.setBarResize('bar1', size);
    this.props.reconcileHeightsWithinContraints(RESIZE_MINS);
  }

  get bar2() {
    return this.props.resizes.bar2;
  }
  set bar2(size: number) {
    this.props.setBarResize('bar2', size);
    this.props.reconcileHeightsWithinContraints(RESIZE_MINS, true);
  }

  render() {
    return (
      <div class={styles.rows}>
        <div style={{ height: `calc(100% - ${this.bar1 + this.bar2}px)` }}>{this.$slots['1']}</div>
        <ResizeBar
          position="top"
          vModel={this.bar1}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={this.props.maxHeight - this.bar2}
          min={32}
          reverse={true}
        />
        <div style={{ height: `${this.bar1}px` }}>{this.$slots['2']}</div>
        <ResizeBar
          position="top"
          vModel={this.bar2}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={this.props.maxHeight}
          min={50}
          reverse={true}
        />
        <div class={styles.segmented} style={{ height: `${this.bar2}px` }}>
          <div class={styles.controlsCell}>{this.$slots['3']}</div>
          <div class={styles.controlsCell}>{this.$slots['4']}</div>
          <div class={styles.controlsCell}>{this.$slots['5']}</div>
        </div>
      </div>
    );
  }
}
