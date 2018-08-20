import { BaseInput } from './BaseInput';
import { Component, Prop } from 'vue-property-decorator';
import { IFileMetadata } from './index';

@Component({})
export default class FileInput extends BaseInput<string, IFileMetadata> {

  @Prop() value: string;
  @Prop() metadata: IFileMetadata;

}
