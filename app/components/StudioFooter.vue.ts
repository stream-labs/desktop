import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import StreamingController from './StreamingController.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';

@Component({
  components: {
    StreamingController,
    PerformanceMetrics,
  },
})
export default class StudioFooterComponent extends Vue {
  @Prop() locked: boolean;
}
