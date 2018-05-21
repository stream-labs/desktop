import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { fonts } from '../../../services/widget-settings/fonts';

@Component({
  components: { Multiselect }
})
export default class WFontFamily extends Vue {

  @Prop()
  value: Object;

  fonts = fonts;
}
