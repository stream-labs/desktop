import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import { BaseInput } from './BaseInput';
import { IDateMetadata } from './index';
import { $t } from 'services/i18n';
import VCalendar from 'v-calendar';
import Vue from 'vue';
import DatePicker from 'v-calendar/lib/components/date-picker.umd';

Vue.use(VCalendar);

@Component({})
export default class DateInput extends BaseInput<string, IDateMetadata> {
  @Prop() readonly value: string;

  @Prop({ default: () => ({}) })
  readonly metadata: IDateMetadata;

  @Prop() readonly title: string;

  localValue: null;

  render() {
    return (
      <span data-role="input" data-type="date" data-name={this.options.name}>
        <DatePicker v-model={this.localValue} disabled={this.options.disabled} data-temp="true" />
      </span>
    );
  }
}
