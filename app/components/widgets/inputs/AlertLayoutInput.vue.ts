import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { IListMetadata } from '../../shared/inputs';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import ImagePickerInput from '../../shared/inputs/ImagePickerInput.vue';
import { CustomizationService } from 'services/customization';

@Component({
  components: { ImagePickerInput },
})
export default class AlertLayoutInput extends BaseInput<string, IListMetadata<string>> {
  @Inject() customizationService: CustomizationService;

  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: IListMetadata<string>;

  @Prop() readonly title: string;

  get layoutOptions() {
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';

    return [
      {
        description: require(`../../../../media/images/alert-box/layout-bottom-${nightMode}.png`),
        value: 'above',
      },
      {
        description: require(`../../../../media/images/alert-box/layout-over-${nightMode}.png`),
        value: 'banner',
      },
      {
        description: require(`../../../../media/images/alert-box/layout-side-${nightMode}.png`),
        value: 'side',
      },
    ];
  }

  get meta(): IListMetadata<string> {
    return { options: this.layoutOptions, ...this.metadata };
  }
}
