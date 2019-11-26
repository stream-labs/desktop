import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
    Mixer,
  },
})
export default class StudioControls extends Vue {}
