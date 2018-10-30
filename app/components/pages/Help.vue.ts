import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import electron from 'electron';

@Component({
})
export default class Help extends Vue {
  openDiscord() {
    electron.remote.shell.openExternal('https://discordapp.com/invite/stream');
  }

  openYoutube() {
    electron.remote.shell.openExternal('https://www.youtube.com/user/TwitchAlerts');
  }

  openYoutubeQuickstart() {
    electron.remote.shell.openExternal('https://www.youtube.com/watch?v=d--1z_W9IVw');
  }

  openYoutubeMerch() {
    electron.remote.shell.openExternal('https://www.youtube.com/watch?v=epd8cYG2ArI');
  }

  openYoutubeAffiliates() {
    electron.remote.shell.openExternal('https://www.youtube.com/watch?v=cHMyxE5NsFQ');
  }

  openYoutubeFrames() {
    electron.remote.shell.openExternal('https://www.youtube.com/watch?v=WnRhaZaQ2ns');
  }

  openYoutubeTroubleshoot() {
    electron.remote.shell.openExternal('https://www.youtube.com/watch?v=GfVQ9KhBlDU');
  }

  openYoutubeTwitch() {
    electron.remote.shell.openExternal('https://www.youtube.com/watch?v=aplbiAgZjtY&t');
  }
}
