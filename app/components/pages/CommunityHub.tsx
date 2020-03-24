import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import SideBar from './community-hub/SideBar';
import styles from './community-hub/CommunityHub.m.less';
import { Inject } from 'services';
import { CommunityHubService } from 'services/community-hub';

@Component({})
export default class CommunityHub extends TsxComponent {
  @Inject() communityHubService: CommunityHubService;

  get currentTab() {
    return this.communityHubService.views.currentPage;
  }

  render() {
    const PageComponent = this.currentTab.component;
    return (
      <div style="width: 100%; height: 100%; display: flex;">
        <SideBar />
        <div style="width: 100%; height: 100%;">
          <div class={styles.mainHeader}>{this.currentTab.title}</div>
          <PageComponent />
        </div>
      </div>
    );
  }
}
