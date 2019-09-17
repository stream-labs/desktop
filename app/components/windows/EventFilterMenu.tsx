import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { WindowsService } from 'services/windows';
import { RecentEventsService } from 'services/recent-events';
import { BoolInput, NumberInput } from 'components/shared/inputs/inputs';
import styles from './EventFilterMenu.m.less';

@Component({})
export default class EventFilterMenu extends TsxComponent<{}> {
  @Inject() windowsService: WindowsService;
  @Inject() recentEventsService: RecentEventsService;

  cancel() {
    this.windowsService.closeChildWindow();
  }

  get mainFilters() {
    return this.recentEventsService.filters.main;
  }

  get subFilters() {
    return this.recentEventsService.filters.sub;
  }

  get resubFilters() {
    return this.recentEventsService.filters.resub;
  }

  get minMonthsFilter() {
    return this.recentEventsService.filters.minMonths;
  }

  get subsEnabled() {
    return this.subFilters.hasOwnProperty('subscription') && this.subFilters['subscription'].value;
  }

  get resubsEnabled() {
    return this.resubFilters.hasOwnProperty('resub') && this.resubFilters['resub'].value;
  }

  updateFilter(filter: string, value: any) {
    this.recentEventsService.updateFilterPreference(filter, value);
  }

  render(h: Function) {
    return (
      <ModalLayout customControls showControls={false}>
        <div slot="content" class={styles.flexColumn}>
          <div class={styles.flexRow}>
            <div class={styles.halfWidth}>
              <h2>{$t('General')}</h2>
              {Object.keys(this.mainFilters).map(filter => (
                <div>
                  <BoolInput
                    value={this.mainFilters[filter].value}
                    metadata={{ title: $t(this.mainFilters[filter].name) }}
                    onInput={(value: boolean) => this.updateFilter(filter, value)}
                  />
                </div>
              ))}
            </div>
            <div class={styles.halfWidth}>
              {Object.keys(this.subFilters).map(
                filter =>
                  filter === 'subscription' && (
                    <div>
                      <BoolInput
                        value={this.subFilters[filter].value}
                        metadata={{ title: $t(this.subFilters[filter].name) }}
                        onInput={(value: boolean) => this.updateFilter(filter, value)}
                        class={styles.categoryHeader}
                      />
                    </div>
                  ),
              )}
              {Object.keys(this.subFilters).map(
                filter =>
                  filter !== 'subscription' &&
                  this.subsEnabled && (
                    <div>
                      <BoolInput
                        value={this.subFilters[filter].value}
                        metadata={{ title: $t(this.subFilters[filter].name) }}
                        onInput={(value: boolean) => this.updateFilter(filter, value)}
                      />
                    </div>
                  ),
              )}
            </div>
          </div>
          <div class={styles.flexRow}>
            <div class={styles.fullWidth}>
              {Object.keys(this.resubFilters).map(
                filter =>
                  filter === 'resub' && (
                    <div>
                      <BoolInput
                        value={this.resubFilters[filter].value}
                        metadata={{ title: $t(this.resubFilters[filter].name) }}
                        onInput={(value: boolean) => this.updateFilter(filter, value)}
                        class={styles.categoryHeader}
                      />
                    </div>
                  ),
              )}
              <div class={styles.resubOptions}>
                {Object.keys(this.resubFilters).map(
                  filter =>
                    filter !== 'resub' &&
                    this.resubsEnabled &&
                    filter !== 'filter_subscription_minimum_months' &&
                    filter !== 'filter_subscription_minimum_enabled' && (
                      <div>
                        <BoolInput
                          value={this.resubFilters[filter].value}
                          metadata={{ title: $t(this.resubFilters[filter].name) }}
                          onInput={(value: boolean) => this.updateFilter(filter, value)}
                        />
                      </div>
                    ),
                )}
              </div>
              <div class={styles.minimum}>
                {Object.keys(this.resubFilters).map(
                  filter =>
                    filter === 'filter_subscription_minimum_enabled' &&
                    this.resubsEnabled && (
                      <div>
                        <BoolInput
                          value={this.resubFilters[filter].value}
                          metadata={{ title: $t(this.resubFilters[filter].name) }}
                          onInput={(value: boolean) => this.updateFilter(filter, value)}
                        />
                      </div>
                    ),
                )}
                {Object.keys(this.minMonthsFilter).map(
                  filter =>
                    filter === 'filter_subscription_minimum_months' &&
                    this.resubsEnabled && (
                      <div class={styles.monthsInputContainer}>
                        <NumberInput
                          value={this.minMonthsFilter[filter].value}
                          metadata={{ min: 1, max: 120, isInteger: true }}
                          onInput={(value: number) => this.updateFilter(filter, value)}
                          class={styles.monthsInput}
                        />
                        <p class={styles.monthsLabel}>{this.minMonthsFilter[filter].name}</p>
                      </div>
                    ),
                )}
              </div>
            </div>
          </div>
        </div>
        <div slot="controls">
          <button class="button button--action" onClick={this.cancel}>
            {$t('Done')}
          </button>
        </div>
      </ModalLayout>
    );
  }
}
