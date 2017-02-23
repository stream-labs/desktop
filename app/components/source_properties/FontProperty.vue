<template>
<div>
  <label>{{ property.description }}</label>
  <div class="FontProperty-container">
    <label>Family</label>
    <multiselect
      class="FontProperty-multiselect"
      v-model="selectedFamily"
      :options="fontFamilies"
      track-by="family"
      label="family">
      <template slot="option" scope="props">
        <span :style="{ fontFamily: props.option.family }">
          {{ props.option.family }}
        </span>
      </template>
    </multiselect>
    <label>Style</label>
    <multiselect
      class="FontProperty-multiselect"
      v-model="selectedFont"
      :options="selectedFamily.fonts"
      track-by="style"
      label="style">
      <template slot="option" scope="props">
        <span
          :style="styleForFont(props.option)">
          {{ props.option.style }}
        </span>
      </template>
    </multiselect>
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

      selectedFamily: {
        fonts: []
      },
      selectedFont: null
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
    }
  },

  computed: {
    fontsByFamily() {
      return _.groupBy(this.fonts, 'family');
    },

    fontFamilies() {
      return _.sortBy(_.map(this.fontsByFamily, (family, name) => {
        return {
          family: name,
          fonts: family
        };
      }), 'family');
    }
  }

};
</script>

<style lang="less" scoped>
.FontProperty-container {
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.FontProperty-multiselect {
  margin-bottom: 20px;
}
</style>
