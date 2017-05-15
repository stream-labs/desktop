<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IInputValue, TObsType } from './Input';
import IntInput from './IntInput.vue';


@Component
class UintInput extends IntInput {
  static obsType: TObsType;

  @Prop()
  value: IInputValue<number>;
}

UintInput.obsType = 'OBS_PROPERTY_UINT';
export default UintInput;

</script>
