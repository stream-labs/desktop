import { Component, Prop, Watch } from 'vue-property-decorator';
import { Input, IFormInput, TObsType, IBitmaskInput } from './Input';
import { EBit, default as Utils } from '../../../services/utils';

@Component
class BitMaskInput extends Input<IBitmaskInput> {

  static obsType: TObsType;

  @Prop()
  value: IBitmaskInput;

  flags: EBit[] = [];

  mounted() {
    this.updateFlags();
  }

  @Watch('value')
  updateFlags() {
    this.flags = Utils.numberToBinnaryArray(this.value.value, this.value.size).reverse();
  }

  onChangeHandler(index: number, state: boolean) {
    this.$set(this.flags, index, Number(state));
    const value = Utils.binnaryArrayToNumber(this.flags.reverse());
    this.emitInput({ ...this.value, value });
  }

}

BitMaskInput.obsType = 'OBS_PROPERTY_BITMASK';

export default BitMaskInput;
