import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { $t } from 'services/i18n';

@Component({})
export default class SelectableWidget extends Vue {

  @Prop()
  selected: boolean;

  @Prop()
  inspected: boolean;

  @Prop()
  name: string;

  @Prop()
  description: string;

  buttonTextForWidget() {
    return this.selected ? $t('Remove Widget') : $t('Add Widget');
  }

}
