<template>
  <div class="SourcePreview" ref="preview"></div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ObsApiService } from '../../services/obs-api';
import electron from '../../vendor/electron';
import { Inject } from '../../services/service';

const { webFrame, screen } = electron;

@Component({})
export default class SourcePreview extends Vue {

  @Inject()
  obsApiService: ObsApiService;

  @Prop()
  sourceName: string;

  $refs: {
    preview: HTMLElement
  };

  mounted() {
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  created() {
    this.obsApiService.createSourceDisplay(
      this.sourceName,
      'Preview Window'
    );
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.obsApiService.removeSourceDisplay('Preview Window');
  }

  onResize() {
    const preview = this.$refs.preview;
    const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
    const rect = preview.getBoundingClientRect();

    this.obsApiService.resizeDisplay(
      'Preview Window',
      rect.width * factor,
      rect.height * factor
    );

    this.obsApiService.moveDisplay(
      'Preview Window',
      rect.left * factor,
      rect.top * factor
    );
  }
}
</script>

<style lang="less" scoped>

  .SourcePreview {
    height: 100%;
    background-color: black;
  }

</style>
