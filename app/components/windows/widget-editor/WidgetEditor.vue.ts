import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import ModalLayout from 'components/ModalLayout.vue';
import Tabs from 'components/Tabs.vue';
import Display from 'components/shared/Display.vue';

@Component({
  components: {
    ModalLayout,
    Tabs,
    Display
  }
})
export default class WidgetWindow extends Vue {
  @Prop() slots: any[];
  @Prop() settings: any[];

  previewSource = { id: '' }

  createProjector() {}
}
