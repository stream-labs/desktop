<template>
<div class="studio-page">
  <studio-editor />
  <studio-controls />
  <studio-footer />
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import StudioEditor from '../StudioEditor.vue';
import StudioControls from '../StudioControls.vue';
import StudioFooter from '../StudioFooter.vue';

@Component({
  components: {
    StudioEditor,
    StudioControls,
    StudioFooter
  }
})
export default class Studio extends Vue {
}
</script>

<style lang="less" scoped>
.studio-page {
  display: flex;
  flex-direction: column;
}
</style>
