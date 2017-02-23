<template>
<div>
  <label>{{ property.description }}</label>
  <div class="FontProperty-container">
    <label>Family</label>
    <multiselect
      ref="family"
      class="FontProperty-multiselect"
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

    <label>Style</label>
    <multiselect
      ref="font"
      class="FontProperty-multiselect"
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

    <label>Size</label>
    <div class="FontProperty-sizeContainer">
      <input
        ref="size"
        type="text"
        :value="selectedSize"
        @change="setFont({})"/>
      <select
        class="FontProperty-presets"
        @change="setFontSizePreset">
        <option
          v-for="preset in fontSizePresets"
          :value="preset"
          :selected="false">
          {{ preset }}
        </option>
      </select>
    </div>
  </div>
</div>
</template>

<script>
// This is a node native module for accessing OS fonts
const fontManager = window.require('font-manager');
import _ from 'lodash';

import Multiselect from 'vue-multiselect';

export default {

  components: {
    Multiselect
  },

  props: [
    'property'
  ],

  data() {
    return {
      fonts: fontManager.getAvailableFontsSync(),
    }
  },

  methods: {
    // CSS styles for a particular font
    styleForFont(font) {
      let fontStyle = 'normal';

      if (font.italic) {
        fontStyle = 'italic';
      }

      return {
        fontFamily: font.family,
        fontWeight: font.weight,
        fontStyle
      }
    },

    setSizePreset(event) {
      this.selectedSize = event.target.value;
    },

    // Converts a list of fonts in the same family to
    // a family object.
    fontsToFamily(fonts) {
      return {
        family: fonts[0].family,
        fonts: fonts
      };
    },

    setFamily(family) {
      // When a new family is selected, we have to select a
      // default style.  This will be "Regular" if it exists.
      // Otherwise, it will be the first family on the list.

      let style;

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
        style
      });
    },

    setStyle(font) {
      this.setFont({
        style: font.style
      });
    },

    setFontSizePreset(event) {
      this.$refs.size.value = event.target.value;
      this.setFont({});
    },

    // Generic function for setting the current font.
    // Values that are left blank will be filled with
    // the currently selected value.
    setFont(args) {
      let defaults = {
        face: this.$refs.font.value.family,
        style: this.$refs.font.value.style,
        size: this.$refs.size.value
      };

      let fontObj = Object.assign(defaults, args);

      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: fontObj
      });
    },

    restyleSelects() {
      this.restyleSelect(this.$refs.family);
      this.restyleSelect(this.$refs.font);
    },

    // This is a hack to make the vue-multiselect components
    // show the currently selected value in the appropriate font
    restyleSelect(select) {
      let input = select.$refs.search;
      input.style['font-family'] = this.selectedFont.family;

      if (this.selectedFont.italic) {
        input.style['font-style'] = 'italic';
      } else {
        input.style['font-style'] = 'normal';
      }

      input.style['font-weight'] = this.selectedFont.weight;
    }
  },

  mounted() {
    this.restyleSelects();
  },

  watch: {
    selectedFont() {
      this.restyleSelects();
    }
  },

  computed: {
    selectedFamily() {
      return this.fontsToFamily(this.fontsByFamily[this.property.value.face]);
    },

    selectedFont() {
      return _.find(this.selectedFamily.fonts, font => {
        return font.style === this.property.value.style;
      });
    },

    selectedSize() {
      return this.property.value.size;
    },

    fontsByFamily() {
      return _.groupBy(this.fonts, 'family');
    },

    fontFamilies() {
      return _.sortBy(_.map(this.fontsByFamily, fonts => {
        return this.fontsToFamily(fonts);
      }), 'family');
    },

    fontSizePresets() {
      return [
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '18',
        '24',
        '36',
        '48',
        '64',
        '72',
        '96',
        '144',
        '288'
      ];
    }
  }

};
</script>

<style lang="less" scoped>
.FontProperty-container {
  border-left: 2px solid #ccc;
  padding: 15px 0 15px 15px;
  margin-bottom: 20px;
}

.FontProperty-multiselect {
  margin-bottom: 20px;
}

.FontProperty-sizeContainer {
  position: relative;
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
