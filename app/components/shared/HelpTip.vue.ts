import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { DismissablesService, EDismissable } from 'services/dismissables';
import TsxComponent from 'components/tsx-component';

interface IHelpTipProps {
  dismissableKey: EDismissable;
  position: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  };
  tipPosition?: 'left' | 'right';
}

@Component({})
export default class HelpTip extends TsxComponent<IHelpTipProps> {
  @Inject() dismissablesService: DismissablesService;
  @Prop() dismissableKey: EDismissable;
  @Prop() position: { top?: string; left?: string; bottom?: string; right?: string };
  @Prop({ default: 'left' }) tipPosition: 'left' | 'right';

  get shouldShow() {
    // TODO: This is a hack to access the store and preserve reactivity
    this.dismissablesService.state[this.dismissableKey];
    return this.dismissablesService.shouldShow(this.dismissableKey);
  }

  closeHelpTip() {
    this.dismissablesService.dismiss(this.dismissableKey);
  }
}
