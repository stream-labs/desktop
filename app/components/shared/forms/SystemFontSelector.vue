<template>
  <div>
    <div class="input-container">
      <div class="input-label">
        <label>Font Family</label>
      </div>
      <div class="input-wrapper">
        <multiselect
          ref="family"
          class="multiselect--font"
          :value="selectedFamily"
          :options="fontFamilies"
          :allow-empty="false"
          track-by="family"
          label="family"
          @input="setFamily">
          <template slot="option" scope="props">
            <span :style="{ fontFamily: props.option.family }">
              {{ props.option.family }}
            </span>
          </template>
        </multiselect>
      </div>
    </div>
    <div class="input-container">
      <div class="input-label">
        <label>Font Style</label>
      </div>
      <div class="input-wrapper">
        <multiselect
          ref="font"
          class="multiselect--font"
          :value="selectedFont"
          :options="selectedFamily.fonts"
          :allow-empty="false"
          track-by="style"
          label="style"
          @input="setStyle">
          <template slot="option" scope="props">
            <span
              :style="styleForFont(props.option)">
              {{ props.option.style }}
            </span>
          </template>
        </multiselect>
      </div>
    </div>
    <font-size-selector :value="value.value.size" @input="setSize" />
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Watch, Prop } from 'vue-property-decorator';
import { IFormInput, Input, IFont } from './Input';
import { Multiselect } from 'vue-multiselect';
import FontSizeSelector from './FontSizeSelector.vue';
import fontManager from 'font-manager';

const OBS_FONT_BOLD = 1 << 0;
const OBS_FONT_ITALIC = 1 << 1;


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
  monospace: boolean;
}

interface IFontSelect extends HTMLElement {
  value: IFontDescriptor;
}

@Component({
  components: { Multiselect, FontSizeSelector }
})
export default class SystemFontSelector extends Input<IFormInput<IFont>>{

  @Prop()
  value: IFormInput<IFont>;

  fonts: IFontDescriptor[] = fontManager.getAvailableFontsSync();

  $refs: {
    family: HTMLInputElement,
    font: IFontSelect,
    size: HTMLInputElement,
  }

  // CSS styles for a particular font
  styleForFont(font: IFontDescriptor) {
    let fontStyle = 'normal';

    if (font.italic) {
      fontStyle = 'italic';
    }

    return {
      fontFamily: font.family,
      fontWeight: font.weight,
      fontStyle
    };
  }

  // Converts a list of fonts in the same family to
  // a family object.
  fontsToFamily(fonts: IFontDescriptor[]) {
    if (fonts) {
      return {
        family: fonts[0].family,
        fonts
      };
    }

    return { family: '', fonts: [] };
  }

  setFamily(family: {family: string, fonts: IFontDescriptor[]}) {
    // When a new family is selected, we have to select a
    // default style.  This will be "Regular" if it exists.
    // Otherwise, it will be the first family on the list.

    let style: string;

    let regular = _.find(family.fonts, font => {
      return font.style === 'Regular';
    });

    if (regular) {
      style = regular.style;
    } else {
      style = family.fonts[0].style;
    }

    this.setFont({
      face: family.family,
      flags: this.styleToFlags(style)
    });
  }

  styleToFlags(style: string) {
    // These are specific to the GDI+ Text property
    let flags = 0;
    if (style.match(/Italic/)) flags |= OBS_FONT_ITALIC;
    if (style.match(/Bold/)) flags |= OBS_FONT_BOLD;

    return flags;
  }

  setStyle(font: IFontDescriptor) {
    this.setFont({ flags: this.styleToFlags(font.style) });
  }

  setSize(size: string) {
    this.setFont({ size: Number(size) });
  }

  // Generic function for setting the current font.
  // Values that are left blank will be filled with
  // the currently selected value.
  setFont(args: IFont) {
    const fontObj = { ...args };

    // If we want to properly apply a system font, path must be null
    fontObj.path = '';

    // Apply current values for parameters that were not passed
    if (fontObj.face === void 0) fontObj.face = this.$refs.font.value.family;
    if (fontObj.size === void 0) fontObj.size = this.value.value.size;
    if (fontObj.flags === void 0) fontObj.flags = this.styleToFlags(this.$refs.font.value.style);

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

    let input = select.$refs.search;
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
    return _.find(this.selectedFamily.fonts, font => {
      if ((this.value.value.flags & OBS_FONT_BOLD) && (!font.style.match(/Bold/))) return false;
      if ((this.value.value.flags & OBS_FONT_ITALIC) && (!font.style.match(/Italic/))) return false;

      return true;
    });
  }

  get fontsByFamily() {
    return _.groupBy(this.fonts, 'family');
  }

  get fontFamilies() {
    return _.sortBy(_.map(this.fontsByFamily, fonts => {
      return this.fontsToFamily(fonts);
    }), 'family');
  }


}
</script>

<style lang="less" scoped>
@import "../../../styles/index";

.multiselect--font {
  margin-bottom: 0px;
}

.FontProperty-presets {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  border: 0;
  background-color: rgba(0,0,0,0);
  cursor: pointer;
  outline: none;
}
</style>
