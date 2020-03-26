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

  get title() {
    if (this.currentTab.title) return this.currentTab.title;
    const chatroom = this.communityHubService.views.currentChat;
    return (
      <div style="display: flex; align-items: center;">
        <img class={styles.avatar} src={chatroom.avatar} />
        <div style="margin-left: 16px;">{chatroom.name}</div>
      </div>
    );
  }

  render() {
    const PageComponent = this.currentTab.component;
    return (
      <div style="width: 100%; height: 100%; display: flex;">
        <SideBar />
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
          <div class={styles.mainHeader}>{this.title}</div>
          <PageComponent />
        </div>
      </div>
    );
  }
}
