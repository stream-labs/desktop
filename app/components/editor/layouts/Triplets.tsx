import cx from 'classnames';
import BaseLayout, { LayoutProps, ILayoutSlotArray } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class Triplets extends BaseLayout {
  isColumns = true;

  async mounted() {
    this.mountResize();
    this.setMins(['1', '4'], ['2', '5'], ['3', '6']);
  }
  destroyed() {
    this.destroyResize();
  }

  get vectors() {
    return [
      ['1', '4'],
      ['2', '5'],
      ['3', '6'],
    ] as ILayoutSlotArray;
  }

  stackedSection(slots: string[], width: string) {
    return (
      <div class={styles.stacked} style={{ width }}>
        {slots.map(slot => (
          <div class={styles.cell}>{this.$slots[slot]}</div>
        ))}
      </div>
    );
  }

  render() {
    return (
      <div class={cx(styles.columns, styles.sidePadded)}>
        {this.stackedSection(['1', '4'], `${100 - (this.resizes.bar1 + this.resizes.bar2) * 100}%`)}
        <ResizeBar
          position="right"
          value={this.bar1}
          onInput={(value: number) => this.setBar('bar1', value)}
          onResizestart={() => this.resizeStartHandler()}
          onResizestop={() => this.resizeStopHandler()}
          max={this.calculateMax(this.mins.rest + this.bar2)}
          min={this.mins.bar1}
          reverse={true}
        />
        {this.stackedSection(['2', '5'], `${this.resizes.bar1 * 100}%`)}
        <ResizeBar
          position="left"
          value={this.bar2}
          onInput={(value: number) => this.setBar('bar2', value)}
          onResizestart={() => this.resizeStartHandler()}
          onResizestop={() => this.resizeStopHandler()}
          max={this.calculateMax(this.mins.rest + this.mins.bar1)}
          min={this.mins.bar2}
          reverse={true}
        />
        {this.stackedSection(['3', '6'], `${this.resizes.bar2 * 100}%`)}
      </div>
    );
  }
}
