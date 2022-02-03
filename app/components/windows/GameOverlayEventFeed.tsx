import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { RecentEvents } from 'components/shared/ReactComponentList';
import styles from './GameOverlayEventFeed.m.less';

@Component({})
export default class GameOverlayEventFeed extends TsxComponent<{}> {
  render() {
    return <RecentEvents componentProps={{ isOverlay: true }} class={styles.main} />;
  }
}
