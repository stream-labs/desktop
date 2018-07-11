import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

export interface IWInputMetadata {
  required?: boolean;
  description?: string;
  hint?: string;
}

export abstract class WInput<TValueType, TMetadataType extends IWInputMetadata> extends Vue {

  @Prop()
  value: TValueType;

  @Prop()
  label: string;

  @Prop({ default: () => ({}) })
  metadata: TMetadataType;

  required = this.metadata.required === void 0 ? false : this.metadata.required;
  description = this.metadata.description === void 0 ? '' : this.metadata.description;
  hint = this.metadata.hint === void 0 ? '' : this.metadata.hint;

  emitInput(eventData: TValueType) {
    this.$emit('input', eventData);
  }

}
