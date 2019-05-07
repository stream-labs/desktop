import Vue from 'vue';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { getComponents, IWindowOptions, WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import TitleBar from '../TitleBar.vue';
import { AppService } from 'services/app';

@Component({
  components: {
    TitleBar,
    ...getComponents(),
  },
})
export default class ChildWindow extends Vue {
  @Inject() private windowsService: WindowsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private appService: AppService;

  components: { name: string; isShown: boolean; title: string; hideStyleBlockers: boolean }[] = [];
  private refreshingTimeout = 0;

  mounted() {
    this.onWindowUpdatedHandler(this.options);
    this.windowsService.windowUpdated.subscribe(windowInfo => {
      if (windowInfo.windowId !== 'child') return;
      this.onWindowUpdatedHandler(windowInfo.options);
    });
  }

  get options() {
    return this.windowsService.state.child;
  }

  get theme() {
    return this.customizationService.currentTheme;
  }

  get currentComponent() {
    return this.components[this.components.length - 1];
  }

  get componentsToRender() {
    return this.components.filter(c => c.name && !this.appLoading);
  }

  get appLoading() {
    return this.appService.state.loading;
  }

  clearComponentStack() {
    this.components = [];
  }

  private setWindowTitle() {
    electron.remote.getCurrentWindow().setTitle(this.currentComponent.title);
  }

  windowResizeTimeout: number;

  windowSizeHandler() {
    if (!this.windowsService.state.child.hideStyleBlockers) {
      this.windowsService.updateStyleBlockers('child', true);
    }
    clearTimeout(this.windowResizeTimeout);

    this.windowResizeTimeout = window.setTimeout(
      () => this.windowsService.updateStyleBlockers('child', false),
      200,
    );
  }

  private onWindowUpdatedHandler(options: IWindowOptions) {
    window.removeEventListener('resize', this.windowSizeHandler);
    // If the window was closed, just clear the stack
    if (!options.isShown) {
      this.clearComponentStack();
      return;
    }

    if (options.preservePrevWindow) {
      this.handlePreservePrevWindow(options);
      return;
    }

    if (options.isPreserved) {
      this.handleIsPreservedWindow();
      return;
    }

    this.clearComponentStack();

    // This is essentially a race condition, but make a best effort
    // at having a successful paint cycle before loading a component
    // that will do a bunch of synchronous IO.
    clearTimeout(this.refreshingTimeout);
    this.refreshingTimeout = window.setTimeout(() => {
      this.components.push({
        name: options.componentName,
        isShown: true,
        title: options.title,
        hideStyleBlockers: options.hideStyleBlockers,
      });
      this.setWindowTitle();
      window.addEventListener('resize', this.windowSizeHandler);
    }, 50);
  }

  private handlePreservePrevWindow(options: IWindowOptions) {
    this.currentComponent.isShown = false;
    this.components.push({
      name: options.componentName,
      isShown: true,
      title: options.title,
      hideStyleBlockers: options.hideStyleBlockers,
    });
    this.setWindowTitle();
    window.addEventListener('resize', this.windowSizeHandler);
  }

  private handleIsPreservedWindow() {
    this.components.pop();
    this.currentComponent.isShown = true;
    this.setWindowTitle();
    window.addEventListener('resize', this.windowSizeHandler);
  }
}
