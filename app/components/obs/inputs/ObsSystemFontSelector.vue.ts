import _ from 'lodash';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { IObsFont, IObsInput, ObsInput } from './ObsInput';
import { Multiselect } from 'vue-multiselect';
import ObsFontSizeSelector from './ObsFontSizeSelector.vue';
import fontManager from 'font-manager';
import { EFontStyle } from 'obs-studio-node';

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
  components: { Multiselect, FontSizeSelector: ObsFontSizeSelector },
})
export default class ObsSystemFontSelector extends ObsInput<IObsInput<IObsFont>> {
  @Prop()
  value: IObsInput<IObsFont>;

  fonts: IFontDescriptor[] = fontManager.getAvailableFontsSync();

  $refs: {
    family: HTMLInputElement;
    font: IFontSelect;
    size: HTMLInputElement;
  };

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

  setFamily(family: { family: string; fonts: IFontDescriptor[] }) {
    // When a new family is selected, we have to select a
    // default style.  This will be "Regular" if it exists.
    // Otherwise, it will be the first family on the list.

    let selectedFont: IFontDescriptor;

    const regular = _.find(family.fonts, font => {
      return font.style === 'Regular';
    });

    if (regular) {
      selectedFont = regular;
    } else {
      selectedFont = family.fonts[0];
    }

    this.setFont({
      face: family.family,
      flags: this.getFlagsFromFont(selectedFont),
    });
  }

  getFlagsFromFont(font: IFontDescriptor) {
    return (
      (font.italic ? EFontStyle.Italic : 0) |
      (font.oblique ? EFontStyle.Italic : 0) |
      (font.weight > 400 ? EFontStyle.Bold : 0)
    );
  }

  setStyle(font: IFontDescriptor) {
    this.setFont({ flags: this.getFlagsFromFont(font) });
  }

  setSize(size: string) {
    this.setFont({ size: Number(size) });
  }

  // Generic function for setting the current font.
  // Values that are left blank will be filled with
  // the currently selected value.
  setFont(args: IObsFont) {
    // Stops slider component from eagerly setting value on component load
    if (args.size === this.value.value.size) return;
    const fontObj = { ...args };

    // If we want to properly apply a system font, path must be null
    fontObj.path = '';

    // Apply current values for parameters that were not passed
    if (fontObj.face === void 0) fontObj.face = this.value.value.face;
    if (fontObj.size === void 0) fontObj.size = this.value.value.size;
    if (fontObj.flags === void 0) fontObj.flags = this.getFlagsFromFont(this.$refs.font.value);

    this.emitInput({ ...this.value, value: fontObj });
  }

  restyleSelects() {
    this.restyleSelect(this.$refs.family);
    this.restyleSelect(this.$refs.font);
  }

  // This is a hack to make the vue-multiselect components
  // show the currently selected value in the appropriate font
  restyleSelect(select: any) {
    if (!this.selectedFont) return;

    const input = select.$refs.search;
    input.style['font-family'] = this.selectedFont.family;

    if (this.selectedFont.italic) {
      input.style['font-style'] = 'italic';
    } else {
      input.style['font-style'] = 'normal';
    }

    input.style['font-weight'] = this.selectedFont.weight;
  }

  mounted() {
    this.restyleSelects();
  }

  @Watch('selectedFont')
  selectedFontChangeHandler() {
    this.restyleSelects();
  }

  get selectedFamily() {
    return this.fontsToFamily(this.fontsByFamily[this.value.value.face]);
  }

  get selectedFont() {
    return _.find(
      this.selectedFamily.fonts,
      font => this.value.value.flags === this.getFlagsFromFont(font),
    );
  }

  get fontsByFamily() {
    return _.groupBy(this.fonts, 'family');
  }

  get fontFamilies() {
    return _.sortBy(
      _.map(this.fontsByFamily, fonts => {
        return this.fontsToFamily(fonts);
      }),
      'family',
    );
  }
}
