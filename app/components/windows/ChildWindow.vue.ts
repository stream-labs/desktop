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

  componentExist = true;

  // private widowUpdatedSubscr = this.windowsService.windowUpdated.subscribe(params => {
  //   if (params.windowId !== 'child') return;
  //   this.onWindowUpdatedHandler();
  // });

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

  // private onWindowUpdatedHandler() {
  //   if (this.options.preservePrevWindow || this.options.isPreserved) return;
  //   this.reset();
  // }
}
