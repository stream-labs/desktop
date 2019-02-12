import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';
import { Inject } from 'util/injector';
import electron from 'electron';
import Utils from 'services/utils';
import { Subscription } from 'rxjs';

@Component({})
export default class PlatformAppPageView extends Vue {
  @Inject() platformAppsService: PlatformAppsService;
  @Prop() appId: string;
  @Prop() pageSlot: EAppPageSlot;

  $refs: {
    appContainer: HTMLDivElement;
  };

  resizeInterval: number;
  containerId: number;
  loadSub: Subscription;
  currentPosition: IVec2;
  currentSize: IVec2;

  mounted() {
    this.mountContainer();

    this.resizeInterval = window.setInterval(() => {
      this.checkResize();
    }, 100);

    this.loadSub = this.platformAppsService.appLoad.subscribe(app => {
      if (this.appId === app.id) {
        this.unmountContainer();
        this.mountContainer();
      }
    });
  }

  mountContainer() {
    this.containerId = this.platformAppsService.mountContainer(
      this.appId,
      this.pageSlot,
      electron.remote.getCurrentWindow().id,
      Utils.getWindowId(),
    );
    this.checkResize();
  }

  unmountContainer() {
    this.currentPosition = null;
    this.currentSize = null;
    this.platformAppsService.unmountContainer(
      this.containerId,
      electron.remote.getCurrentWindow().id,
    );
  }

  destroyed() {
    if (this.resizeInterval) clearInterval(this.resizeInterval);
    this.loadSub.unsubscribe();
    this.unmountContainer();
  }

  checkResize() {
    const rect = this.$refs.appContainer.getBoundingClientRect();

    if (this.currentPosition == null || this.currentSize == null || this.rectChanged(rect)) {
      this.currentPosition = { x: rect.left, y: rect.top };
      this.currentSize = { x: rect.width, y: rect.height };

      this.platformAppsService.setContainerBounds(
        this.containerId,
        this.currentPosition,
        this.currentSize,
      );
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
