<template>
  <div class="SourcePreview" ref="preview"></div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ObsApiService } from '../../services/obs-api';
import electron from 'electron';
import { Inject } from '../../util/injector';
import { VideoService } from '../../services/video';
import { WindowsService } from '../../services/windows';

const { remote } = electron;

@Component({})
export default class SourcePreview extends Vue {

  @Inject()
  obsApiService: ObsApiService;

  @Inject()
  videoService: VideoService;

  @Inject()
  windowsService: WindowsService;

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
      'Preview Window',
       remote.getCurrentWindow().getNativeWindowHandle()
    );
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.obsApiService.removeSourceDisplay('Preview Window');
  }

  onResize() {
    const preview = this.$refs.preview;
    const factor = this.windowsService.state.child.scaleFactor;
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
