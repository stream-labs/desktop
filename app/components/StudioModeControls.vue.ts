import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TransitionsService } from 'services/transitions';

@Component({})
export default class Studio extends Vue {
  @Inject() private transitionsService: TransitionsService;

  @Prop() stacked: boolean;

  studioModeTransition() {
    this.transitionsService.executeStudioModeTransition();
  }
}
