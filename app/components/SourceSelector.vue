<template>
<div>
  <h4 class="studioControls-label">
    Sources
  </h4>
  <selector
    class="studioControls-selector"
    :items="sources"
    :activeItem="activeSource"/>
</div>
</template>

<script>
import Selector from './Selector.vue';

export default {
  components: {
    Selector
  },

  computed: {
    sources() {
      return [];
    },

    activeSource() {
      return undefined;
    }
  }
};
</script>
