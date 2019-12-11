import electron from 'electron';
import { Component } from 'vue-property-decorator';
import BrowserView from 'components/shared/BrowserView';
import styles from 'components/RecentEvents.m.less';
import { UserService } from 'services/user';
import { RecentEventsService } from 'services/recent-events';
import { MagicLinkService } from 'services/magic-link';
import { Inject } from 'services/core';
import TsxComponent from 'components/tsx-component';

@Component({})
export default class LegacyEvents extends TsxComponent {
  @Inject() userService: UserService;
  @Inject() recentEventsService: RecentEventsService;
  @Inject() magicLinkService: MagicLinkService;

  magicLinkDisabled = false;

  popoutRecentEvents() {
    this.$emit('popout');
    return this.recentEventsService.openRecentEventsWindow();
  }

  handleBrowserViewReady(view: Electron.BrowserView) {
    if (view.isDestroyed()) return;

    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', async (e, url) => {
      const match = url.match(/dashboard\/([^\/^\?]*)/);

      if (match && match[1] === 'recent-events') {
        this.popoutRecentEvents();
      } else if (match) {
        // Prevent spamming our API
        if (this.magicLinkDisabled) return;
        this.magicLinkDisabled = true;

        try {
          const link = await this.magicLinkService.getDashboardMagicLink(match[1]);
          electron.remote.shell.openExternal(link);
        } catch (e) {
          console.error('Error generating dashboard magic link', e);
        }

        this.magicLinkDisabled = false;
      } else {
        electron.remote.shell.openExternal(url);
      }
    });
  }

  render() {
    return (
      <div>
        <BrowserView
          class={styles.eventContainer}
          src={this.userService.recentEventsUrl()}
          setLocale={true}
          onReady={view => this.handleBrowserViewReady(view)}
        />
      </div>
    );
  }
}
