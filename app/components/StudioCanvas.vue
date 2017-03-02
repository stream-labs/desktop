<template>
<div class="StudioCanvas">
  <source-preview :source="sources[0]"/>
</div>
</template>

<script>
import SourcePreview from './SourcePreview.vue';
import _ from 'lodash';

export default {

  components: {
    SourcePreview
  },

  computed: {
    sources() {
      return _.map(this.$store.getters.activeScene.sources, sourceId => {
        return this.$store.state.sources.sources[sourceId];
      });
    }
  }

};
</script>

<style lang="less" scoped>
.StudioCanvas {
  flex-grow: 1;
  background-color: black;
}
</style>
