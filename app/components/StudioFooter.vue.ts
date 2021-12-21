import { CompactModeService } from 'services/compact-mode';
import { Inject } from 'services/core/injector';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import PerformanceMetrics from './PerformanceMetrics.vue';
import StreamingController from './StreamingController.vue';

@Component({
  components: {
    StreamingController,
    PerformanceMetrics,
  },
})
export default class StudioFooterComponent extends Vue {
  @Inject() private compactModeService: CompactModeService;

  @Prop() locked: boolean;

  get compactMode() {
    return this.compactModeService.compactMode;
  }
}
