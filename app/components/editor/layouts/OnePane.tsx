import cx from 'classnames';
import BaseLayout, { LayoutProps, ILayoutSlotArray } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class OnePane extends BaseLayout {
  isColumns = true;

  async mounted() {
    this.mountResize();
    this.setMins(['2'], ['1', ['3', '4', '5']]);
  }
  destroyed() {
    this.destroyResize();
  }

  get vectors() {
    return ['2', ['1', ['3', '4', '5']]] as ILayoutSlotArray;
  }

  render() {
    return (
      <div class={cx(styles.columns, styles.sidePadded)}>
        <div style={{ width: `${100 - this.resizes.bar1 * 100}%` }} class={styles.cell}>
          {this.$slots['2']}
        </div>
        <ResizeBar
          position="left"
          value={this.bar1}
          onInput={(value: number) => this.setBar('bar1', value)}
          onResizestart={() => this.resizeStartHandler()}
          onResizestop={() => this.resizeStopHandler()}
          max={this.calculateMax(this.mins.rest)}
          min={this.mins.bar1}
          reverse={true}
        />
        <div
          class={styles.rows}
          style={{ width: `${this.resizes.bar1 * 100}%`, paddingTop: '16px' }}
        >
          <div class={styles.cell} style={{ height: '100%' }}>
            {this.$slots['1']}
          </div>
          <div class={styles.segmented}>
            <div class={styles.cell}>{this.$slots['3']}</div>
            <div class={styles.cell}>{this.$slots['4']}</div>
            <div class={styles.cell}>{this.$slots['5']}</div>
          </div>
        </div>
      </div>
    );
  }
}
