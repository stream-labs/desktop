import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import moment from 'moment';
import { RecentEventsService } from 'services/recent-events';
import TsxComponent from './tsx-component';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
import styles from './RecentEvents.m.less';

@Component({})
export default class RecentEvents extends TsxComponent<{}> {
  @Inject() recentEventsService: RecentEventsService;

  get recentEvents() {
    return this.recentEventsService.state.recentEvents;
  }

  render(h: Function) {
    return (
      <div class={styles.container}>
        <div class={styles.topBar}>
          <h2 class="studio-controls__label">{$t('Recent Events')}</h2>
        </div>
        <div class={styles.eventContainer}>
          {this.recentEvents &&
            this.recentEvents.map(event => (
              <div style="display: flex;">
                <span>{moment(event.created_at).fromNow()}</span>
                <span>{event.from}</span>
                {JSON.stringify(event)}
              </div>
            ))}
        </div>
      </div>
    );
  }
}
