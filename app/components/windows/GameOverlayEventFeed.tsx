import { Component, Prop } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import RecentEvents from 'components/RecentEvents';
import styles from './GameOverlayEventFeed.m.less';

@Component({})
export default class GameOverlayEventFeed extends TsxComponent<{}> {
  render() {
    return <RecentEvents isOverlay={true} class={styles.main} />;
  }
}
