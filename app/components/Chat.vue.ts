import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { ChatService } from 'services/chat';
import electron from 'electron';

@Component({})
export default class Chat extends Vue {
  $refs: {
    chat: HTMLDivElement;
  };

  currentPosition: IVec2;
  currentSize: IVec2;
  resizeInterval: number;

  @Inject() chatService: ChatService;

  mounted() {
    this.chatService.mountChat(electron.remote.getCurrentWindow().id);

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);
  }

  destroyed() {
    this.chatService.unmountChat(electron.remote.getCurrentWindow().id);
    clearInterval(this.resizeInterval);
  }

  checkResize() {
    if (!this.$refs.chat) return;

    const rect = this.$refs.chat.getBoundingClientRect();

    if (this.currentPosition == null || this.currentSize == null || this.rectChanged(rect)) {
      this.currentPosition = { x: rect.left, y: rect.top };
      this.currentSize = { x: rect.width, y: rect.height };

      this.chatService.setChatBounds(this.currentPosition, this.currentSize);
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
