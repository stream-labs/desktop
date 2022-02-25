import cx from 'classnames';
import BaseLayout, { LayoutProps, ILayoutSlotArray } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class Pyramid extends BaseLayout {
  async mounted() {
    this.mountResize();
    this.setMins(['1'], ['2', '3']);
  }
  destroyed() {
    this.destroyResize();
  }

  get vectors() {
    return ['1', ['2', '3']] as ILayoutSlotArray;
  }

  render() {
    return (
      <div class={styles.rows}>
        <div class={styles.cell} style={{ height: `${100 - this.resizes.bar1 * 100}%` }}>
          {this.$slots['1']}
        </div>
        <ResizeBar
          position="top"
          value={this.bar1}
          onInput={(value: number) => this.setBar('bar1', value)}
          onResizestart={() => this.resizeStartHandler()}
          onResizestop={() => this.resizeStopHandler()}
          max={this.calculateMax(this.mins.rest)}
          min={this.mins.bar1}
          reverse={true}
        />
        <div
          class={styles.segmented}
          style={{ height: `${this.resizes.bar1 * 100}%`, padding: '0 8px' }}
        >
          {['2', '3'].map(slot => (
            <div class={cx(styles.cell, 'no-top-padding')}>{this.$slots[slot]}</div>
          ))}
        </div>
      </div>
    );
  }
}
