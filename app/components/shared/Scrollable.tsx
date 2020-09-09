import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';

class ScrollableProps {
  className?: string = '';
  isResizable?: boolean = true;
  horizontal?: boolean = false;
}

@Component({ props: createProps(ScrollableProps) })
export default class Scrollable extends TsxComponent<ScrollableProps> {
  render() {
    return (
      <OverlayScrollbarsComponent
        options={{
          autoUpdate: true,
          autoUpdateInterval: 200,
          className: this.props.className,
          resize: this.props.isResizable ? 'both' : 'none',
          sizeAutoCapable: false,
          scrollbars: { clickScrolling: true },
          overflowBehavior: { x: this.props.horizontal ? 'scroll' : 'hidden' },
        }}
      >
        {this.$slots.default}
      </OverlayScrollbarsComponent>
    );
  }
}
