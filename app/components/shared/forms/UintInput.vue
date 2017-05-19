<script lang="ts">
import { Component } from 'vue-property-decorator';
import { TObsType } from './Input';
import IntInput from './IntInput.vue';


@Component
class UintInput extends IntInput {
  static obsType: TObsType;
}

UintInput.obsType = 'OBS_PROPERTY_UINT';
export default UintInput;

</script>
