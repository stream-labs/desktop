import { Component, Prop } from 'vue-property-decorator';
import VueTimepicker from 'vue2-timepicker';
import { BaseInput } from './BaseInput';
import { ITimeMetadata } from './index';

export interface ITime {
  HH?: string;
  H?: string;
  hh?: string;
  a?: string;
  A?: string;
  h?: string;
  kk?: string;
  k?: string;
  m?: string;
  mm?: string;
  s?: string;
  ss?: string;
}

@Component({
  components: {
    VueTimepicker
  }
})
export default class TimePickerInput extends BaseInput<ITime, ITimeMetadata> {
  @Prop() value: ITime;
  @Prop() metadata: ITimeMetadata;
}


// documentation for timepicker
// https://github.com/phoenixwong/vue2-timepicker
