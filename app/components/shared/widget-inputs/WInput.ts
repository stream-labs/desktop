import Vue from 'vue';
import { Prop } from 'vue-property-decorator';


export abstract class WInput<TValueType, TMetadataType> extends Vue {

  @Prop()
  value: TValueType;

  @Prop()
  label: string;

  @Prop()
  metadata: TMetadataType;

  emitInput(eventData: TValueType) {
    this.$emit('input', eventData);
  }

}
