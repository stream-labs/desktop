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

  updateFilter(filter: string, value: boolean | number) {
    this.recentEventsService.updateFilterPreference(filter, value);
  }

  renderBooleanInput(
    key: string,
    filter: { name: string; value: boolean },
    header: boolean = false,
  ) {
    return (
      <BoolInput
        value={filter.value}
        metadata={{ title: $t(filter.name) }}
        onInput={(value: boolean) => this.updateFilter(key, value)}
        class={header ? styles.categoryHeader : ''}
      />
    );
  }

  get renderGeneralFilters() {
    return (
      <div class={styles.halfWidth}>
        <h2>{$t('General')}</h2>
        {Object.keys(this.mainFilters).map(filter => (
          <div>{this.renderBooleanInput(filter, this.mainFilters[filter])}</div>
        ))}
      </div>
    );
  }

  get renderSubFilters() {
    return (
      <div class={styles.halfWidth}>
        {Object.keys(this.subFilters).map(
          filter =>
            filter === 'subscription' && (
              <div>{this.renderBooleanInput(filter, this.subFilters[filter], true)}</div>
            ),
        )}
        {Object.keys(this.subFilters).map(
          filter =>
            filter !== 'subscription' &&
            this.subsEnabled && (
              <div>{this.renderBooleanInput(filter, this.subFilters[filter])}</div>
            ),
        )}
      </div>
    );
  }

  get renderResubFilters() {
    return (
      <div class={styles.fullWidth}>
        {Object.keys(this.resubFilters).map(
          filter =>
            filter === 'resub' && (
              <div>{this.renderBooleanInput(filter, this.resubFilters[filter], true)}</div>
            ),
        )}
        <div class={styles.resubOptions}>
          {Object.keys(this.resubFilters).map(
            filter =>
              filter !== 'resub' &&
              this.resubsEnabled &&
              filter !== 'filter_subscription_minimum_months' &&
              filter !== 'filter_subscription_minimum_enabled' && (
                <div>{this.renderBooleanInput(filter, this.resubFilters[filter])}</div>
              ),
          )}
        </div>
        {this.renderResubMonthsFilter}
      </div>
    );
  }

  get renderResubMonthsFilter() {
    return (
      <div class={styles.minimum}>
        {Object.keys(this.resubFilters).map(
          filter =>
            filter === 'filter_subscription_minimum_enabled' &&
            this.resubsEnabled && (
              <div>{this.renderBooleanInput(filter, this.resubFilters[filter])}</div>
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
    );
  }

  render() {
    return (
      <ModalLayout customControls showControls={false}>
        <div slot="content" class={styles.flexColumn}>
          <div class={styles.flexRow}>
            {this.renderGeneralFilters}
            {this.renderSubFilters}
          </div>
          <div class={styles.flexRow}>{this.renderResubFilters}</div>
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
