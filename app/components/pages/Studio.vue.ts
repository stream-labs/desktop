import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { CustomizationService } from 'services/customization';
import StudioEditor from '../StudioEditor.vue';
import StudioControls from '../StudioControls.vue';
import { Inject } from '../../util/injector';

@Component({
  components: {
    StudioEditor,
    StudioControls
  }
})
export default class Studio extends Vue {
  @Inject() private customizationService: CustomizationService;

  get previewEnabled() {
    return !this.customizationService.state.performanceMode;
  }

  enablePreview() {
    this.customizationService.setSettings({ performanceMode: false });
  }
}
