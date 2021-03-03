import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IDateMetadata } from './index';
import { I18nService } from 'services/i18n';
import Datepicker from 'vuejs-datepicker';
import * as locales from 'vuejs-datepicker/dist/locale';
import { Inject } from 'services/core';
import styles from './DateInput.m.less';

@Component({ components: { Datepicker } })
export default class DateInput extends BaseInput<number, IDateMetadata> {
  @Inject() i18nService: I18nService;
  @Prop() readonly value: number;

  @Prop({ default: () => ({}) })
  readonly metadata: IDateMetadata;

  @Prop() readonly title: string;

  get date() {
    return this.value ? new Date(this.value) : null;
  }

  getOptions(): IDateMetadata {
    // define default props
    const options = super.getOptions();
    return {
      ...options,
      disablePastDates: false,
    };
  }

  locale = locales[this['i18nService'].state.locale.split('-')[0]]; // use 2 letters code

  get disabledDates() {
    if (this.options.disablePastDates) return null;

    // @see https://github.com/charliekassel/vuejs-datepicker#disabled-dates
    return { to: new Date(Date.now() - 1000 * 60 * 60 * 24) };
  }

  emitInput(val: number, ev: Event) {
    if (!val) {
      super.emitInput(val, ev);
      return;
    }

    // Datepicker returns a date without resetting current time
    // so reset it now
    const date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    super.emitInput(date.valueOf(), ev);
  }

  render() {
    return (
      <span
        data-role="input"
        data-type="date"
        data-name={this.options.name}
        class={styles['date-input']}
      >
        <Datepicker
          language={this.locale}
          value={this.date}
          disabledDates={this.disabledDates}
          onInput={(value: number, ev: Event) => this.emitInput(value ? +value : null, ev)}
        />
        <input
          type="hidden"
          value={this.value}
          name={this.options.uuid}
          v-validate={this.validate}
        />
      </span>
    );
  }
}
