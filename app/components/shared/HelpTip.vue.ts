import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { DismissablesService, EDismissable } from 'services/dismissables';
import { CompactModeService } from 'services/compact-mode';

@Component({})
export default class HelpTip extends Vue {
  @Inject() dismissablesService: DismissablesService;
  @Inject() compactModeService: CompactModeService;
  @Prop() dismissableKey: EDismissable;

  get shouldShow() {
    return this.dismissablesService.shouldShow(this.dismissableKey);
  }

  closeHelpTip() {
    this.dismissablesService.dismiss(this.dismissableKey);
  }

  get isCompactMode(): boolean {
    return this.compactModeService.compactMode;
  }
}
