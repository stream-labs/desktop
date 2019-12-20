import { Component } from 'vue-property-decorator';
import RecentEvents from 'components/RecentEvents';
import TsxComponent from 'components/tsx-component';

@Component({})
export default class MiniFeed extends TsxComponent {
  render() {
    return <RecentEvents isOverlay={false} />;
  }
}
