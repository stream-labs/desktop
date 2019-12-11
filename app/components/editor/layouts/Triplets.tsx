import cx from 'classnames';
import TsxComponent, { createProps } from 'components/tsx-component';
import { LayoutProps } from './Default';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

const RESIZE_MINS = {
  bar1: { absolute: 16, reasonable: 150 },
  bar2: { absolute: 16, reasonable: 150 },
};

@Component({ props: createProps(LayoutProps) })
export default class Triplets extends TsxComponent<LayoutProps> {
  // mounted() {
  //   this.props.reconcileSizeWithinContraints(RESIZE_MINS);
  //   window.addEventListener('resize', this.windowResizeHandler);
  // }
  // destroyed() {
  //   window.removeEventListener('resize', this.windowResizeHandler);
  // }

  // windowResizeHandler() {
  //   this.props.reconcileSizeWithinContraints(RESIZE_MINS);
  // }

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
          max={500}
          min={this.props.calculateMin(['2', '5'])}
          reverse={true}
        />
        {this.stackedSection(['2', '5'], `${this.bar1}px`)}
        <ResizeBar
          position="left"
          vModel={this.bar2}
          onResizestart={() => this.props.resizeStartHandler()}
          onResizestop={() => this.props.resizeStopHandler()}
          max={500}
          min={this.props.calculateMin(['3', '6'])}
          reverse={true}
        />
        {this.stackedSection(['3', '6'], `${this.bar2}px`)}
      </div>
    );
  }
}
