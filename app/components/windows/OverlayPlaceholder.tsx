import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';

@Component({})
export default class OverlayPlaceholder extends TsxComponent<{}> {
  render(h: Function) {
    return (
      <div style="-webkit-app-region: drag; width: 100%; height: 100%;">
        <div />
      </div>
    );
  }
}
