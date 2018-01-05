import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({})
export default class HelpTip extends Vue {

  helpTip: boolean = true;

  closeHelpTip() {
    this.helpTip = false;
  }
}
