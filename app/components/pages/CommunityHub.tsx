import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import SideBar from './community-hub/SideBar';
import MatchmakeForm from './community-hub/MatchmakeForm';
import styles from './community-hub/CommunityHub.m.less';

@Component({})
export default class CommunityHub extends TsxComponent {
  currentTab = 'Matchmaking';

  render() {
    return (
      <div style="width: 100%; height: 100%; display: flex;">
        <SideBar />
        <div style="width: 100%; height: 100%;">
          <div class={styles.mainHeader}>{this.currentTab}</div>
          <MatchmakeForm />
        </div>
      </div>
    );
  }
}
