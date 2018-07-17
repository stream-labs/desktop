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

  get options() {
    return this.windowsService.state.child;
  }

  get componentName() {
    return this.options.componentName;
  }

}
