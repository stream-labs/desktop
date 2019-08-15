import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from './tsx-component';

@Component({})
export default class RecentEvents extends TsxComponent<{}> {
  render(h: Function) {
    return (
      <div class="section">
        <div />
      </div>
    );
  }
}
