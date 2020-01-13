import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TransitionsService } from 'services/transitions';
import { $t } from 'services/i18n';

@Component({})
export default class Studio extends Vue {
  @Inject() private transitionsService: TransitionsService;

  @Prop() stacked: boolean;

  studioModeTransition() {
    this.transitionsService.executeStudioModeTransition();
  }
}
