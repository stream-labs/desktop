import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import { LayoutProps } from './index';

@Component({ props: createProps(LayoutProps) })
export default class extends TsxComponent<LayoutProps> {
  maxHeight = 500;

  render() {
    const { bar1, bar2 } = this.props.resizes;
    return (
      <div>
        <slot name="1" style={{ height: `calc(100% - ${bar1 + bar2}px)` }} />
        <ResizeBar
          position="top"
          vModel={bar1}
          onResizeStop={() => this.props.resizeStopHandler()}
          onResizeStart={() => this.props.resizeStartHandler()}
          max={this.maxHeight - bar2}
          min={32}
          reverse={true}
        />
        <slot name="2" style={{ height: `${bar1}px` }} />
        <ResizeBar
          position="top"
          vModel={bar2}
          onResizeStop={() => this.props.resizeStopHandler()}
          onResizeStart={() => this.props.resizeStopHandler()}
          max={this.maxHeight}
          min={50}
          reverse={true}
        />
        <div style={{ height: `${bar2}px` }}>
          <slot name="3" />
          <slot name="4" />
          <slot name="5" />
        </div>
      </div>
    );
  }
}
