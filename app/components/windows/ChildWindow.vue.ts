import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { getComponents, WindowsService } from 'services/windows';


@Component({
  components: {
    ...getComponents()
  }
})
export default class ChildWindow extends Vue {
  @Inject() private windowsService: WindowsService;


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

  get componentName() {
    return this.options.componentName;
  }
  //
  // destroy() {
  //   this.widowUpdatedSubscr.unsubscribe();
  // }

  destroy() {
    this.widowUpdatedSubscr.unsubscribe();
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

    this.$set(this.components, this.activeComponentInd, {
      name: this.options.componentName,
      isShown: this.options.isShown
    });

  }
}
