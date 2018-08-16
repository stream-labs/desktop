import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { getComponents, WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';

@Component({
  components: {
    ...getComponents()
  }
})
export default class ChildWindow extends Vue {
  @Inject() private windowsService: WindowsService;
  @Inject() private customizationService: CustomizationService;

  activeComponentInd = 0;

  components = [
    { name: this.options.componentName, isShown: this.options.isShown},
    { name: '', isShown: false},
  ];

  private widowUpdatedSubscr = this.windowsService.windowUpdated.subscribe(params => {
    if (params.windowId !== 'child') return;
    this.onWindowUpdatedHandler();
  });

  get options() {
    return this.windowsService.state.child;
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }

  get componentName() {
    return this.options.componentName;
  }

  private onWindowUpdatedHandler() {
    if (!this.options.isShown) {
      this.components = [
        { name: '', isShown: false},
        { name: '', isShown: false},
      ];
      this.activeComponentInd = 0;
    } else if (this.options.preservePrevWindow) {
      this.components[this.activeComponentInd].isShown = false;
      this.activeComponentInd++;
      if (this.activeComponentInd > 1 ) this.activeComponentInd = 0;
    } else if (this.options.isPreserved) {
      this.$set(this.components, this.activeComponentInd, {
        name: '',
        isShown: false
      });
      this.activeComponentInd--;
      if (this.activeComponentInd < 0) this.activeComponentInd = 1;
      this.components[this.activeComponentInd].isShown = true;
      return;
    }

    // This is essentially a race condition, but make a best effort
    // at having a successful paint cycle before loading a component
    // that will do a bunch of synchronous IO.
    setTimeout(() => {
      this.$set(this.components, this.activeComponentInd, {
        name: this.options.componentName,
        isShown: this.options.isShown
      });
    }, 50);

  }
}
