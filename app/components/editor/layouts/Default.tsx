import cx from 'classnames';
import BaseLayout, { LayoutProps, ILayoutSlotArray } from './BaseLayout';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';
import { createProps } from 'components/tsx-component';

@Component({ props: createProps(LayoutProps) })
export default class Default extends BaseLayout {
  async mounted() {
    this.mountResize();
    this.setMins(['1'], ['2'], ['3', '4', '5']);
  }
  destroyed() {
    this.destroyResize();
  }

  get vectors() {
    return ['1', '2', ['3', '4', '5']] as ILayoutSlotArray;
  }

  get bottomSection() {
    return (
      <div
        class={styles.segmented}
        style={{ height: `${this.resizes.bar2 * 100}%`, padding: '0 8px' }}
      >
        {['3', '4', '5'].map(slot => (
          <div class={cx(styles.cell, 'no-top-padding')}>{this.$slots[slot]}</div>
        ))}
      </div>
    );
  }

  render() {
    return (
      <div class={styles.rows}>
        <div
          class={styles.cell}
          style={{ height: `${100 - (this.resizes.bar1 + this.resizes.bar2) * 100}%` }}
        >
          {this.$slots['1']}
        </div>
        <ResizeBar
          position="top"
          value={this.bar1}
          onInput={(value: number) => this.setBar('bar1', value)}
          onResizestart={() => this.resizeStartHandler()}
          onResizestop={() => this.resizeStopHandler()}
          max={this.calculateMax(this.mins.rest + this.bar2)}
          min={this.mins.bar1}
          reverse={true}
        />
        <div
          style={{ height: `${this.resizes.bar1 * 100}%` }}
          class={cx(styles.cell, 'no-top-padding')}
        >
          {this.$slots['2']}
        </div>
        <ResizeBar
          position="top"
          value={this.bar2}
          onInput={(value: number) => this.setBar('bar2', value)}
          onResizestart={() => this.resizeStartHandler()}
          onResizestop={() => this.resizeStopHandler()}
          max={this.calculateMax(this.mins.rest + this.mins.bar1)}
          min={this.mins.bar2}
          reverse={true}
        />
        {this.bottomSection}
      </div>
    );
  }
}
