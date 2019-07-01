import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Loading } from 'streamlabs-beaker';

@Component({
  components: { Loading },
})
export default class Chatbot extends Vue {
  readyToShow = false;

  mounted() {
    this.$slots.default[0].elm.addEventListener('did-finish-load', () => {
      this.readyToShow = true;
    });
  }
}
