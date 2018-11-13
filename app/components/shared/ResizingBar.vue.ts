import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})
export default class ResizingBar extends Vue {

  position: string = 'left';

  mounted() {

    console.log('ResizingBarMounted', this);
  }
}
