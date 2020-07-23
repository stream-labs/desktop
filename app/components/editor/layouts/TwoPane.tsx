import cx from 'classnames';
import BaseLayout, { LayoutProps, ILayoutSlotArray } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class TwoPane extends BaseLayout {
  isColumns = true;

  async mounted() {
    this.mountResize();
    this.$emit('totalWidth', await this.mapVectors(['2', '5', ['1', ['3', '4']]]), this.isColumns);
    this.setMins(['2'], ['1', ['3', '4']], ['5']);
  }
  destroyed() {
    this.destroyResize();
  }

  get vectors() {
    return ['2', '5', ['1', ['3', '4']]] as ILayoutSlotArray;
  }

  get midsection() {
    return (
      <div class={styles.rows} style={{ width: `${this.resizes.bar1 * 100}%`, paddingTop: '16px' }}>
        <div style={{ height: '100%' }} class={styles.cell}>
          {this.$slots['1']}
        </div>
        <div class={styles.segmented}>
          <div class={styles.cell}>{this.$slots['3']}</div>
          <div class={styles.cell}>{this.$slots['4']}</div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class={cx(styles.columns, styles.sidePadded)}>
        <div
          style={{ width: `${100 - (this.resizes.bar1 + this.resizes.bar2) * 100}%` }}
          class={styles.cell}
        >
          {this.$slots['2']}
        </div>
        <ResizeBar
          position="left"
          value={this.bar1}
          onInput={(value: number) => this.setBar('bar1', value)}
          onResizestart={() => this.resizeStartHandler()}
          onResizestop={() => this.resizeStopHandler()}
          max={this.calculateMax(this.mins.rest + this.bar2)}
          min={this.mins.bar1}
          reverse={true}
        />
        {this.midsection}
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
        <div style={{ width: `${this.resizes.bar2 * 100}%` }} class={styles.cell}>
          {this.$slots['5']}
        </div>
      </div>
    );
  }
}
