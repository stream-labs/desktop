import { Component, Prop } from 'vue-property-decorator';
import { debounce, throttleSetter } from 'lodash-decorators';
import { TObsType, IObsInput, ObsInput } from './ObsInput';
import Utils from '../../../services/utils';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';

interface ICapture {
  window: string;
}

@Component({})
class ObsCaptureInput extends ObsInput<IObsInput<string>> {
  static obsType: TObsType;

  @Prop()
  value: IObsInput<string>;

  @debounce(500)
  setValue(window: string) {
    console.log("setValue called with window " + JSON.stringify(window) + " , " + JSON.stringify(this.value));
    this.emitInput({ ...this.value, value: window });
  }

  mounted() {
    console.log("mounted from obscaptureinput");
    this.setValue(this.window);
  }

  get window() {
    console.log("get window from obscaptureinput");
    return `#${this.value.value}`;
  }

  get obsCapture(): ICapture {
    console.log("get obsCapture from obscaptureinput");
    return { window: this.value.value };
  }

  get metadata() {
    console.log("get metadate from obscaptureinput");

    return metadata.capture({ title: this.value.description, options: [
      ] });
  }

  render() {
    console.log("render from obscaptureinput");
    return (
      <HFormGroup
        value={this.window}
        onInput={(window: string) => {
          console.log("HFormGroup onInput " + window);
          this.setValue(window); 
        }}
        metadata={this.metadata}
      />
    );
  }
}

ObsCaptureInput.obsType = 'OBS_PROPERTY_CAPTURE';

export default ObsCaptureInput;
