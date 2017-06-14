<template>
<div class="studio-page">
  <studio-editor />
  <studio-controls />
  <studio-footer />
</div>
</template>

<script>
import StudioEditor from '../StudioEditor.vue';
import StudioControls from '../StudioControls.vue';
import StudioFooter from '../StudioFooter.vue';

export default {
  components: {
    StudioEditor,
    StudioControls,
    StudioFooter
  }
};
</script>

<style lang="less" scoped>
.studio-page {
  display: flex;
  flex-direction: column;
}
</style>
