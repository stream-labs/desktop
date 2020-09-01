import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';

class ScrollableProps {
  className?: string = '';
  isFlexbox?: boolean = false;
  isResizable?: boolean = true;
  horizontal?: boolean = false;
}

@Component({ props: createProps(ScrollableProps) })
export default class Scrollable extends TsxComponent<ScrollableProps> {
  render() {
    return (
      <OverlayScrollbarsComponent
        options={{
          className: this.props.className,
          resize: this.props.isResizable ? 'both' : 'none',
          sizeAutoCapable: !this.props.isFlexbox,
          scrollbars: { clickScrolling: true },
          overflowBehavior: { x: this.props.horizontal ? 'scroll' : 'hidden' },
        }}
      >
        {this.$slots.default}
      </OverlayScrollbarsComponent>
    );
  }
}
