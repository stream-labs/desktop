import { ObsInput } from './ObsInput';
import { Component, Prop } from 'vue-property-decorator';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { SliderInput } from 'components/shared/inputs/inputs';

@Component({ components: { SliderInput, HFormGroup } })
export default class ObsFontSizeSelector extends ObsInput<number> {
  @Prop()
  value: number;

  setFontSizePreset(size: number) {
    this.emitInput(size);
  }

  get metadata() {
    return { data: this.fontSizePresets, piecewise: true, piecewiseLabel: true, max: 288, min: 9 };
  }

  get fontSizePresets() {
    return [9, 10, 11, 12, 13, 14, 18, 24, 36, 48, 64, 72, 96, 144, 288];
  }
}
