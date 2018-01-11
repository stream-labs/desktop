import { Component, Prop } from 'vue-property-decorator';
import { Input, IFormInput, TObsType, IFont, IGoogleFont } from './Input';
import GoogleFontSelector from './GoogleFontSelector.vue';
import SystemFontSelector from './SystemFontSelector.vue';

@Component({
  components: { GoogleFontSelector, SystemFontSelector }
})
class FontInput extends Input<IFormInput<IFont>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<IFont>;

  isGoogleFont = !!this.value.value.path;

  setFont(font: IFormInput<IFont>) {
    this.emitInput(font);
  }


  setGoogleFont(font: IGoogleFont) {
    this.emitInput({
      ...this.value,
      value: {
        path: font.path,
        face: font.face,
        size: Number(font.size)
      }
    });
  }


  get googleFont() {
    return {
      path: this.value.value.path,
      face: this.value.value.face,
      size: this.value.value.size
    };
  }


  setFontType(e: Event) {
    this.isGoogleFont = e.target['checked'];
  }

}

FontInput.obsType = 'OBS_PROPERTY_FONT';

export default FontInput;
