import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import moment from 'moment';
import { RecentEventsService, IRecentEvent } from 'services/recent-events';
import TsxComponent from './tsx-component';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
import styles from './RecentEvents.m.less';

@Component({})
export default class RecentEvents extends TsxComponent<{}> {
  @Inject() recentEventsService: RecentEventsService;

  get recentEvents() {
    console.log(this.recentEventsService.state.recentEvents);
    return this.recentEventsService.state.recentEvents;
  }

  formatMoney(amount: string, type: string) {
    const prefix = type === 'donation' ? '$' : '';
    const numAmount = Number.parseFloat(amount);
    return `${prefix}${type === 'donation' ? numAmount.toFixed(2) : numAmount.toFixed(0)}`;
  }

  subscriptionMap(subPlan: string) {
    return {
      '1000': $t('Tier 1'),
    }[subPlan];
  }

  eventString(event: IRecentEvent) {
    switch (event.type) {
      case 'donation':
        return (
          $t('has donated') +
          (event.crate_item ? $t(' with %{name}', { name: event.crate_item.name }) : '')
        );
      case 'follow':
        return $t('has followed');
      case 'subscription':
        if (event.months > 1) {
          return $t('has resubscribed (%{tier}) for %{streak} months in a row! (%{months} total)', {
            tier: this.subscriptionMap(event.sub_plan),
            streak: event.streak_months,
            months: event.months,
          });
        }
        return $t('has subscribed (%{tier})', { tier: this.subscriptionMap(event.sub_plan) });
      case 'bits':
        return $t('has used %{amount} bits', { amount: event.amount });
      case 'host':
        return $t('has hosted you with %{viewers} viewers', { viewers: event.viewers });
      case 'raid':
        return $t('has raided you with a party of %{viewers}', { viewers: event.raiders });
      case 'sticker':
        return $t('has used %{amount} %{currency} for %{skill}', {
          amount: event.amount,
          currency: event.currency,
          skill: event.skill,
        });
    }
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
              <div class={styles.cell}>
                <span class={styles.timestamp}>{moment(event.created_at).fromNow(true)}</span>
                <span class={styles.name}>{event.from}</span>
                <span>{this.eventString(event)}</span>
                {event.formatted_amount && (
                  <span class={styles.money}>{event.formatted_amount}</span>
                )}
                {event.message && <span class={styles.whisper}>{event.message}</span>}
                <i class="icon-reset" />
              </div>
            ))}
        </div>
      </div>
    );
  }
}
