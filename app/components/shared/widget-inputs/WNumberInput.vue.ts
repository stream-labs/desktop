import { Component, Prop } from 'vue-property-decorator';
import { IWInputMetadata, WInput } from './WInput';

interface IWNumberMetadata extends IWInputMetadata {
  min?: number;
  max?: number;
  placeholder?: string;
}

@Component({
})
export default class WNumberInput extends WInput<number, IWNumberMetadata> {

  @Prop()
  value: number;

  @Prop({ default: {} })
  metadata: IWNumberMetadata;


}
