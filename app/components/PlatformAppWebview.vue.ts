import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Subscription } from 'rxjs';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import { Inject } from 'util/injector';
import electron from 'electron';
import Utils from 'services/utils';

@Component({})
export default class PlatformAppWebview extends Vue {
  @Inject() platformAppsService: PlatformAppsService;
  // @Prop() appId: string;
  // @Prop() pageSlot: EAppPageSlot;
  @Prop() params: { appId: string; pageSlot: EAppPageSlot };

  $refs: {
    appContainer: HTMLDivElement;
  };

  resizeInterval: number;

  containerId: number;

  mounted() {
    this.containerId = this.platformAppsService.mountConatiner(
      this.appId,
      this.pageSlot,
      electron.remote.getCurrentWindow().id,
      Utils.getWindowId(),
    );
    this.checkResize();

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100); // TODO: Is this too fast?
  }

  destroyed() {
    if (this.resizeInterval) clearInterval(this.resizeInterval);
    this.platformAppsService.unmountContainer(this.containerId);
  }

  currentPosition: IVec2;
  currentSize: IVec2;

  checkResize() {
    const rect = this.$refs.appContainer.getBoundingClientRect();

    if (
      this.currentPosition == null ||
      this.currentSize == null ||
      rect.left !== this.currentPosition.x ||
      rect.top !== this.currentPosition.y ||
      rect.width !== this.currentSize.x ||
      rect.height !== this.currentSize.y
    ) {
      this.platformAppsService.setContainerBounds(
        this.containerId,
        { x: rect.left, y: rect.top },
        { x: rect.width, y: rect.height },
      );
    }
  }

  get appId() {
    return this.params.appId;
  }

  get pageSlot() {
    return this.params.pageSlot;
  }
}
