import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';

class ScrollableProps {
  className?: string = '';
}

@Component({ props: createProps(ScrollableProps) })
export default class Scrollable extends TsxComponent<ScrollableProps> {
  render() {
    return (
      <OverlayScrollbarsComponent
        options={{
          className: this.props.className,
          resize: 'both',
          scrollbars: { clickScrolling: true },
        }}
      >
        {this.$slots.default}
      </OverlayScrollbarsComponent>
    );
  }
}
