import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import electron from 'electron';

@Component({
})
export default class Help extends Vue {
  openDiscord() {
    electron.remote.shell.openExternal('https://discordapp.com/invite/stream');
  }
}
