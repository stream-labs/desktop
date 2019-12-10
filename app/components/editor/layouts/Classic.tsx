import cx from 'classnames';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';
import { LayoutProps } from './Default';

const RESIZE_MINS = {
  bar1: { absolute: 32, reasonable: 300 },
};

@Component({ props: createProps(LayoutProps) })
export default class Classic extends TsxComponent<LayoutProps> {
  mounted() {
    this.props.reconcileSizeWithinContraints(RESIZE_MINS);
    window.addEventListener('resize', this.windowResizeHandler);
  }
  destroyed() {
    window.removeEventListener('resize', this.windowResizeHandler);
  }

  windowResizeHandler() {
    this.props.reconcileSizeWithinContraints(RESIZE_MINS);
  }

  get bar1() {
    return this.props.resizes.bar1;
  }
  set bar1(size: number) {
    if (size === 0) return;
    this.props.setBarResize('bar1', size);
    this.props.reconcileSizeWithinContraints(RESIZE_MINS);
  }

  render() {
    return (
      <div class={styles.rows}>
        <div class={styles.cell} style={{ height: `calc(100% - ${this.bar1}px)` }}>
          {this.$slots['1']}
        </div>
        <ResizeBar
          position="top"
          vModel={this.bar1}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={this.props.max}
          min={RESIZE_MINS.bar1.absolute}
          reverse={true}
        />
        <div class={styles.segmented} style={{ height: `${this.bar1}px`, padding: '0 8px' }}>
          <div class={cx(styles.cell, styles.noTopPadding)}>{this.$slots['2']}</div>
          <div class={cx(styles.cell, styles.noTopPadding)}>{this.$slots['3']}</div>
          <div class={cx(styles.cell, styles.noTopPadding)}>{this.$slots['4']}</div>
        </div>
      </div>
    );
  }
}
