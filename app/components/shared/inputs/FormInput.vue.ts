import * as sharedInputComponents from 'components/shared/inputs/inputs';
import * as widgetInputComponents from 'components/widgets/inputs/inputs';
import { EInputType, IInputMetadata } from 'components/shared/inputs';
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';

/**
 * Generic Form Input
 */
@Component({
  components: {
    ...sharedInputComponents,
    ...widgetInputComponents,
  },
})
export default class FormInput extends BaseInput<any, IInputMetadata> {
  @Prop()
  readonly type: EInputType;

  @Prop()
  readonly value: undefined;

  @Prop({ default: () => ({}) })
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  /**
   * returns a componentName based on the type
   */
  get componentName() {
    const type = this.options.type;

    // tslint:disable-next-line:prefer-template
    return type.charAt(0).toUpperCase() + type.slice(1) + 'Input';
  }

  getOptions() {
    // merge props into options object
    const options = super.getOptions();
    options.type = this.type || options.type;
    options.title = this.title || options.title;
    return options;
  }
}
