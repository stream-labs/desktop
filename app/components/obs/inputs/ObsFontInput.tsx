import { Component, Prop } from 'vue-property-decorator';
import { ObsInput, IObsInput, TObsType, IObsFont, IGoogleFont } from './ObsInput';
import GoogleFontSelector from './ObsGoogleFontSelector';
import ObsSystemFontSelector from './ObsSystemFontSelector.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';

@Component({})
class ObsFontInput extends ObsInput<IObsInput<IObsFont>> {
  static obsType: TObsType;

  @Prop()
  value: IObsInput<IObsFont>;

  isGoogleFont = !!this.value.value.path;

  setFont(font: IObsInput<IObsFont>) {
    this.emitInput(font);
  }

  setGoogleFont(font: IGoogleFont) {
    this.emitInput({
      ...this.value,
      value: {
        path: font.path,
        face: font.face,
        flags: font.flags,
        size: Number(font.size),
      },
    });
  }

  get googleFont() {
    return {
      path: this.value.value.path,
      face: this.value.value.face,
      flags: this.value.value.flags,
      size: this.value.value.size,
    };
  }

  setFontType(val: boolean) {
    this.isGoogleFont = val;
  }

  render() {
    return (
      <div>
        <HFormGroup
          value={this.isGoogleFont}
          onInput={(val: boolean) => this.setFontType(val)}
          metadata={metadata.bool({ title: $t('Use Google Font') })}
        />
        {this.isGoogleFont && (
          <GoogleFontSelector value={this.googleFont} onInput={font => this.setGoogleFont(font)} />
        )}
        {!this.isGoogleFont && (
          <ObsSystemFontSelector value={this.value} onInput={font => this.setFont(font)} />
        )}
      </div>
    );
  }
}

ObsFontInput.obsType = 'OBS_PROPERTY_FONT';

export default ObsFontInput;
