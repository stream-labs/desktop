import electron from 'electron';
import { Component } from 'vue-property-decorator';
import BrowserView from 'components/shared/BrowserView';
import styles from 'components/RecentEvents.m.less';
import { UserService } from 'services/user';
import { RecentEventsService } from 'services/recent-events';
import { MagicLinkService } from 'services/magic-link';
import { Inject } from 'services/core';
import BaseElement from './BaseElement';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';

@Component({})
export default class LegacyEvents extends BaseElement {
  @Inject() userService: UserService;
  @Inject() recentEventsService: RecentEventsService;
  @Inject() magicLinkService: MagicLinkService;

  mins = { x: 360, y: 150 };

  magicLinkDisabled = false;

  popoutRecentEvents() {
    this.$emit('popout');
    return this.recentEventsService.openRecentEventsWindow();
  }

  handleBrowserViewReady(view: Electron.BrowserView) {
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
          remote.shell.openExternal(link);
        } catch (e: unknown) {
          console.error('Error generating dashboard magic link', e);
        }

        this.magicLinkDisabled = false;
      } else {
        remote.shell.openExternal(url);
      }
    });
  }

  get element() {
    if (!this.userService.isLoggedIn) {
      return (
        <div class={styles.eventContainer}>
          <div class={styles.empty}>{$t('There are no events to display')}</div>
        </div>
      );
    }

    return (
      <div style="height: 100%;">
        <BrowserView
          class={styles.eventContainer}
          src={this.userService.recentEventsUrl()}
          setLocale={true}
          onReady={view => this.handleBrowserViewReady(view)}
        />
      </div>
    );
  }

  render() {
    return this.renderElement();
  }
}
