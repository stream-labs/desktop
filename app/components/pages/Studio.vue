<template>
<div class="studioPage">
  <studio-canvas />
  <studio-controls />
  <studio-footer />
</div>
</template>

<script>
import StudioCanvas from '../StudioCanvas.vue';
import StudioControls from '../StudioControls.vue';
import StudioFooter from '../StudioFooter.vue';

export default {
  components: {
    StudioCanvas,
    StudioControls,
    StudioFooter
  }
};
</script>

<style lang="less" scoped>
.studioPage {
  display: flex;
  flex-direction: column;
}
</style>
