import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import StreamingController from './StreamingController.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';

@Component({
  components: {
    StreamingController,
    PerformanceMetrics,
  },
})
export default class StudioFooterComponent extends Vue {
  @Inject() customizationService: CustomizationService;

  @Prop() locked: boolean;

  get compactMode() {
    return this.customizationService.state.compactMode;
  }
}
