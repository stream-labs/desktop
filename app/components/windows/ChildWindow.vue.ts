import Vue from 'vue';
import electron from 'electron';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { getComponents, WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import TitleBar from '../TitleBar.vue';

@Component({
  components: {
    TitleBar,
    ...getComponents()
  }
})
export default class ChildWindow extends Vue {
  @Inject() private windowsService: WindowsService;
  @Inject() private customizationService: CustomizationService;

  components: { name: string; isShown: boolean; }[] = [];

  created() {
    electron.remote.getCurrentWindow().setTitle(this.options.title);
  }

  mounted() {
    this.onWindowUpdatedHandler();
    this.windowsService.windowUpdated.subscribe(params => {
      if (params.windowId !== 'child') return;
      this.onWindowUpdatedHandler();
    });
  }

  get options() {
    return this.windowsService.state.child;
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }

  get currentComponent() {
    return this.components[this.components.length - 1];
  }

  clearComponentStack() {
    this.components = [];
  }

  private onWindowUpdatedHandler() {
    // If the window was closed, just clear the stack
    if (!this.options.isShown) {
      this.clearComponentStack();
      return;
    }

    if (this.options.preservePrevWindow) {
      this.currentComponent.isShown = false;
      this.components.push({ name: this.options.componentName, isShown: true });
      return;
    }

    if (this.options.isPreserved) {
      this.components.pop();
      this.currentComponent.isShown = true;
      return;
    }

    this.clearComponentStack();

    // This is essentially a race condition, but make a best effort
    // at having a successful paint cycle before loading a component
    // that will do a bunch of synchronous IO.
    setTimeout(() => {
      this.components.push({ name: this.options.componentName, isShown: true });
    }, 50);
  }
}
