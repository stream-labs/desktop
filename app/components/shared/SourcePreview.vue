<template>
  <div class="SourcePreview" ref="preview"></div>
</template>

<script>

  import Obs from '../../api/Obs';

  const { webFrame, screen } = window.require('electron');

  export default {

    props: ['sourceName'],

    mounted() {
      window.addEventListener('resize', this.onResize);
      this.onResize();
    },

    created() {
      Obs.createSourceDisplay(
        this.sourceName,
        'Preview Window'
      );
    },

    beforeDestroy() {
      window.removeEventListener('resize', this.onResize);
      Obs.removeSourceDisplay('Preview Window');
    },

    methods: {

      onResize() {
        const preview = this.$refs.preview;
        const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
        const rect = preview.getBoundingClientRect();

        Obs.resizeDisplay(
          'Preview Window',
          rect.width * factor,
          rect.height * factor
        );

        Obs.moveDisplay(
          'Preview Window',
          rect.left * factor,
          rect.top * factor
        );
      }
    }
  };
</script>

<style lang="less" scoped>

  .SourcePreview {
    height: 100%;
    background-color: black;
  }

</style>
