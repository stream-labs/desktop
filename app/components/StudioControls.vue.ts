import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from 'components/SceneSelector.vue';
import SourceSelector from 'components/SourceSelector.vue';
import Mixer from 'components/Mixer.vue';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
    Mixer,
  },
})
export default class StudioControls extends Vue {}
