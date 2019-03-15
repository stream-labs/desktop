import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from './SceneSelector.vue';
import SourceSelector from './SourceSelector.vue';
import Mixer from './Mixer.vue';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
    Mixer,
  },
})
export default class StudioControls extends Vue {}
