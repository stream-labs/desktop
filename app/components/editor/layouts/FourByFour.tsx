import cx from 'classnames';
import BaseLayout, { LayoutProps } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class FourByFour extends BaseLayout {
  mounted() {
    super.mountResize();
    this.$emit('totalWidth', ['1', ['2', '3'], ['4', '5']]);
  }
  destroyed() {
    super.destroyResize();
  }

  get mins() {
    return {
      bar1: this.props.calculateMin(['2', '3']),
      bar2: this.props.calculateMin(['4', '5']),
      rest: this.props.calculateMin(['1']),
    };
  }

  get bar1() {
    return this.props.resizes.bar1;
  }
  set bar1(size: number) {
    if (size === 0) return;
    this.props.setBarResize('bar1', size, this.mins);
  }

  get bar2() {
    return this.props.resizes.bar2;
  }
  set bar2(size: number) {
    this.props.setBarResize('bar2', size, this.mins);
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
          max={this.props.calculateMax(this.mins.rest + this.bar2)}
          min={this.mins.bar1}
          reverse={true}
        />
        <div class={styles.segmented} style={{ height: `${this.bar1}px` }}>
          <div class={cx(styles.cell, styles.noTopPadding)}>{this.$slots['2']}</div>
          <div class={cx(styles.cell, styles.noTopPadding)}>{this.$slots['3']}</div>
        </div>
        <ResizeBar
          position="top"
          vModel={this.bar2}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={this.props.calculateMax(this.mins.rest + this.mins.bar1)}
          min={this.mins.bar2}
          reverse={true}
        />
        <div class={styles.segmented} style={{ height: `${this.bar2}px`, padding: '0 8px' }}>
          <div class={cx(styles.cell, styles.noTopPadding)}>{this.$slots['4']}</div>
          <div class={cx(styles.cell, styles.noTopPadding)}>{this.$slots['5']}</div>
        </div>
      </div>
    );
  }
}
