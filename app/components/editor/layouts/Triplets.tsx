import cx from 'classnames';
import BaseLayout, { LayoutProps } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class Triplets extends BaseLayout {
  mounted() {
    super.mountResize();
    this.$emit('totalWidth', [['1', '4'], ['2', '5'], ['3', '6']]);
  }
  destroyed() {
    super.destroyResize();
  }

  get mins() {
    return {
      bar1: this.props.calculateMin(['2', '5']),
      bar2: this.props.calculateMin(['3', '6']),
      rest: this.props.calculateMin(['1', '4']),
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
        {this.stackedSection(['1', '4'], `calc(100% - ${this.bar1 + this.bar2}px)`)}
        <ResizeBar
          position="right"
          vModel={this.bar1}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={this.props.calculateMax(this.mins.rest + this.bar2)}
          min={this.mins.bar1}
          reverse={true}
        />
        {this.stackedSection(['2', '5'], `${this.bar1}px`)}
        <ResizeBar
          position="left"
          vModel={this.bar2}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={this.props.calculateMax(this.mins.rest + this.mins.bar1)}
          min={this.mins.bar2}
          reverse={true}
        />
        {this.stackedSection(['3', '6'], `${this.bar2}px`)}
      </div>
    );
  }
}
