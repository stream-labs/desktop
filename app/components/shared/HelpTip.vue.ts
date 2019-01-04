import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { DismissablesService, EDismissable } from 'services/dismissables';

@Component({})
export default class HelpTip extends Vue {
  @Inject() dismissablesService: DismissablesService;
  @Prop() dismissableKey: EDismissable;

  get shouldShow() {
    return this.dismissablesService.shouldShow(this.dismissableKey);
  }

  closeHelpTip() {
    this.dismissablesService.dismiss(this.dismissableKey);
  }
}
