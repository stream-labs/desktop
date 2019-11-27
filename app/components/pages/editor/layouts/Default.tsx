import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

export class LayoutProps {
  resizeStartHandler: () => void = () => {};
  resizeStopHandler: () => void = () => {};
  resizes: { bar1: number; bar2: number } = null;
}

@Component({ props: createProps(LayoutProps) })
export default class extends TsxComponent<LayoutProps> {
  maxHeight = 500;

  render() {
    const { bar1, bar2 } = this.props.resizes;
    return (
      <div class={styles.rows}>
        <div style={{ height: `calc(100% - ${bar1 + bar2}px)` }}>{this.$slots['1']}</div>
        <ResizeBar
          position="top"
          vModel={bar1}
          onResizeStop={() => this.props.resizeStopHandler()}
          onResizeStart={() => this.props.resizeStartHandler()}
          max={this.maxHeight - bar2}
          min={32}
          reverse={true}
        />
        <div style={{ height: `${bar1}px` }}>{this.$slots['2']}</div>
        <ResizeBar
          position="top"
          vModel={bar2}
          onResizeStop={() => this.props.resizeStopHandler()}
          onResizeStart={() => this.props.resizeStopHandler()}
          max={this.maxHeight}
          min={50}
          reverse={true}
        />
        <div style={{ height: `${bar2}px`, display: 'flex' }}>
          {this.$slots['3']}
          {this.$slots['4']}
          {this.$slots['5']}
        </div>
      </div>
    );
  }
}
