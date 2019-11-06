import { Component, Prop } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import RecentEvents from 'components/RecentEvents';

@Component({})
export default class GameOverlayEventFeed extends TsxComponent<{}> {
  render() {
    return <RecentEvents overlay={true} />;
  }
}
