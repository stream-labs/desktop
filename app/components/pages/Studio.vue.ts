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
