import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import TsxComponent from 'components/tsx-component';

export default class Scrollable extends TsxComponent {
  render() {
    return <OverlayScrollbarsComponent>{this.$slots.default}</OverlayScrollbarsComponent>;
  }
}
