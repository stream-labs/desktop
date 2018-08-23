import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import ModalLayout from 'components/ModalLayout.vue';
import Tabs from 'components/Tabs.vue';

@Component({
  components: {
    ModalLayout,
    Tabs
  }
})
export default class WidgetWindow extends Vue {
}
