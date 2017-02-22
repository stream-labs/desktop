<template>
<div>
  <label>{{ property.description }}</label>
  <div class="foundation-ignore">
    <vue-select
      v-model="selectedFamily"
      :options="fontFamilies"/>
  </div>
</div>
</template>

<script>
// This is a node native module for accessing OS fonts
const fontManager = window.require('font-manager');
import VueSelect from 'vue-select';
import _ from 'lodash';

export default {

  components: {
    VueSelect
  },

  props: [
    'property'
  ],

  data() {
    return {
      fonts: fontManager.getAvailableFontsSync(),

      selectedFamily: ''
    }
  },

  computed: {
    fontsByFamily() {
      return _.groupBy(this.fonts, 'family');
    },

    fontFamilies() {
      return _.keys(this.fontsByFamily);
    }
  }

};
</script>
