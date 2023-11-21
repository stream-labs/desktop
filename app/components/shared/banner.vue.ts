import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { remote } from 'electron';

@Component({
  components: {},
})
export default class Banner extends Vue {
  @Prop() title: String;
  @Prop() body: String;
  @Prop() anchorLabel: String;
  @Prop() anchorLink: String;

  openInDefaultBrowser(event: MouseEvent): void {
    const href = (event.currentTarget as HTMLAnchorElement).href;
    const url = new URL(href);
    if (/^https?/.test(url.protocol)) {
      remote.shell.openExternal(url.toString());
    }
  }

  close() {
    this.$emit('close');
  }
}
