import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { ChatService } from 'services/chat';
import electron from 'electron';
import { RestreamService } from 'services/restream';

@Component({})
export default class Chat extends Vue {
  $refs: {
    chat: HTMLDivElement;
  };

  currentPosition: IVec2;
  currentSize: IVec2;
  resizeInterval: number;

  @Prop() restream: boolean;

  @Inject() chatService: ChatService;
  @Inject() restreamService: RestreamService;

  mounted() {
    this.getChatService().mountChat(electron.remote.getCurrentWindow().id);

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);
  }

  destroyed() {
    this.getChatService().unmountChat(electron.remote.getCurrentWindow().id);
    clearInterval(this.resizeInterval);
  }

  @Watch('restream')
  changeChat() {
    const windowId = electron.remote.getCurrentWindow().id;

    this.chatService.unmountChat(windowId);
    this.restreamService.unmountChat(windowId);

    this.getChatService().mountChat(windowId);
    this.currentPosition = null;
    this.currentSize = null;
    this.checkResize();
  }

  getChatService(): RestreamService | ChatService {
    return this.restream ? this.restreamService : this.chatService;
  }

  checkResize() {
    if (!this.$refs.chat) return;

    const rect = this.$refs.chat.getBoundingClientRect();

    if (this.currentPosition == null || this.currentSize == null || this.rectChanged(rect)) {
      this.currentPosition = { x: rect.left, y: rect.top };
      this.currentSize = { x: rect.width, y: rect.height };

      this.getChatService().setChatBounds(this.currentPosition, this.currentSize);
    }
  }

  private rectChanged(rect: ClientRect) {
    return (
      rect.left !== this.currentPosition.x ||
      rect.top !== this.currentPosition.y ||
      rect.width !== this.currentSize.x ||
      rect.height !== this.currentSize.y
    );
  }
}
