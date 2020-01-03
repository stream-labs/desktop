import cx from 'classnames';
import BaseLayout, { LayoutProps } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class OnePane extends BaseLayout {
  mounted() {
    super.mountResize();
    this.$emit('totalWidth', ['2', ['1', ['3', '4', '5']]]);
  }
  destroyed() {
    super.destroyResize();
  }

  get mins() {
    return {
      bar1: this.props.calculateMin(['1', ['3', '4', '5']]),
      rest: this.props.calculateMin(['2']),
    };
  }

  get bar1() {
    return this.props.resizes.bar1;
  }
  set bar1(size: number) {
    if (size === 0) return;
    this.props.setBarResize('bar1', size);
  }

  get bar2() {
    return this.props.resizes.bar2;
  }
  set bar2(size: number) {
    this.props.setBarResize('bar2', size);
  }

  render() {
    return (
      <div class={cx(styles.columns, styles.sidePadded)}>
        <div style={{ width: `calc(100% - ${this.bar1}px)` }} class={styles.cell}>
          {this.$slots['2']}
        </div>
        <ResizeBar
          position="left"
          vModel={this.bar1}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={this.props.calculateMax(this.mins.rest)}
          min={this.mins.bar1}
          reverse={true}
        />
        <div class={styles.rows} style={{ width: `${this.bar1}px`, paddingTop: '16px' }}>
          <div style={{ height: '100%' }}>{this.$slots['1']}</div>
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
