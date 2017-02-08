<template>
<div>
  <div class="studioControls-top">
    <h4 class="studioControls-label">
      Themes
    </h4>
  </div>
  <selector
    class="studioControls-selector"
    :items="themes"
    :activeItem="activeTheme"/>
</div>
</template>

<script>
import Selector from './Selector.vue';

export default {
  components: {
    Selector
  },

  computed: {
    themes() {
      return [];
    },

    activeTheme() {
      return undefined;
    }
  }
};
</script>
