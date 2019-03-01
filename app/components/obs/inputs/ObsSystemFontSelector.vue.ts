import _ from 'lodash';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { IObsFont, IObsInput, ObsInput } from './ObsInput';
import { ListInput } from 'components/shared/inputs/inputs';
import ObsFontSizeSelector from './ObsFontSizeSelector.vue';
import fontManager from 'font-manager';
import { EFontStyle } from 'obs-studio-node';
import { CurryRightAll } from 'lodash-decorators';

/**
 * @tutorial https://github.com/devongovett/font-manager
 */
interface IFontDescriptor {
  path: string;
  postscriptName: string;
  family: string;
  style: string;
  weight: number;
  width: number;
  italic: boolean;
  oblique: boolean;
  monospace: boolean;
}

interface IFontSelect extends HTMLElement {
  value: IFontDescriptor;
}

@Component({
  components: { ListInput, FontSizeSelector: ObsFontSizeSelector },
})
export default class ObsSystemFontSelector extends ObsInput<IObsInput<IObsFont>> {
  @Prop()
  value: IObsInput<IObsFont>;

  fonts: IFontDescriptor[] = fontManager.getAvailableFontsSync();

  // CSS styles for a particular font
  styleForFont(font: IFontDescriptor) {
    let fontStyle = 'normal';

    if (font.italic) {
      fontStyle = 'italic';
    }

    return {
      fontStyle,
      fontFamily: font.family,
      fontWeight: font.weight,
    };
  }

  // Converts a list of fonts in the same family to
  // a family object.
  fontsToFamily(fonts: IFontDescriptor[]) {
    if (fonts) {
      return {
        fonts,
        family: fonts[0].family,
      };
    }

    return { family: '', fonts: [] };
  }

  setFamily(family: string) {
    // When a new family is selected, we have to select a
    // default style.  This will be "Regular" if it exists.
    // Otherwise, it will be the first family on the list.

    const regular = this.fonts.find(font => font.style === 'Regular' && font.family === family);

    const fontForStyle = regular || this.fonts.find(font => font.family === family);

    this.setFont({
      face: family,
      flags: this.getFlagsFromFont(fontForStyle),
      style: fontForStyle.style,
    });
  }

  getFlagsFromFont(font: IFontDescriptor) {
    return (
      (font.italic ? EFontStyle.Italic : 0) |
      (font.oblique ? EFontStyle.Italic : 0) |
      (font.weight > 400 ? EFontStyle.Bold : 0)
    );
  }

  setStyle(style: string) {
    const font = this.fonts.find(f => f.style === style && f.family === this.selectedFont.family);
    this.setFont({ flags: this.getFlagsFromFont(font), style: font.style });
  }

  setSize(size: string) {
    this.setFont({ size: Number(size) });
  }

  setFont(args: IObsFont) {
    // Stops slider component from eagerly setting value on component load
    if (args.size === this.value.value.size) return;

    const fontObj = { ...this.value.value, ...args };
    this.emitInput({ ...this.value, value: fontObj });
  }

  get selectedFont() {
    return this.fonts.find(
      font => this.value.value.face === font.family && this.value.value.style === font.style,
    );
  }

  get stylesForFamily() {
    return this.fonts
      .filter(font => font.family === this.value.value.face)
      .map(font => ({ value: font.style, title: font.style }));
  }

  get fontFamilies() {
    return this.fonts
      .filter((font, idx, self) => self.findIndex(f => f.family === font.family) === idx)
      .map(font => ({ value: font.family, title: font.family }));
  }

  labelStyle() {
    if (!this.selectedFont) return;
    return {
      fontFamily: this.value.value.face,
      fontStyle: this.selectedFont.italic ? 'italic' : 'normal',
      fontWeight: this.selectedFont.weight,
    };
  }

  get familyMetadata() {
    return {
      options: this.fontFamilies,
      allowEmpty: false,
      disabled: this.value.enabled === false,
      labelStyle: this.labelStyle,
      optionStyle: (val: string) => ({ fontFamily: val }),
    };
  }

  get styleMetadata() {
    return {
      options: this.stylesForFamily,
      allowEmpty: false,
      disabled: this.value.enabled === false,
      labelStyle: this.labelStyle,
      optionStyle: (val: string) => {
        if (!this.selectedFont) return;
        const fontStyle = this.fonts.find(
          font => font.family === this.selectedFont.family && font.style === val,
        );
        if (!fontStyle) return;
        return {
          fontFamily: this.selectedFont.family,
          fontStyle: fontStyle.italic ? 'italic' : 'regular',
          fontWeight: fontStyle.weight,
        };
      },
    };
  }
}
