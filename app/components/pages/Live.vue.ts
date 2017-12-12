import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from '../SceneSelector.vue';
import Mixer from '../Mixer.vue';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import Display from '../Display.vue';
import { CustomizationService } from '../../services/customization';
// import VueDraggableResizable from 'vue-draggable-resizable';
import Slider from '../shared/Slider.vue';

@Component({
  components: {
    SceneSelector,
    Mixer,
    Display,
    // 'vue-draggable-resizable': VueDraggableResizable,
    Slider,
  }
})

export default class Live extends Vue {

  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  previewSize= 260;

  get previewEnabled() {
    return this.customizationService.state.livePreviewEnabled;
  }

  set previewEnabled(value: boolean) {
    this.customizationService.setLivePreviewEnabled(value);
  }

  get recenteventsUrl() {
    return this.userService.widgetUrl('recent-events');
  }


  // heightOfChild: number = 900;
  // widthOfChild: number = 100;
  // topOfChild: number = 0;
  // leftOfChild: number = 0;

  // onResizing(left:number, top:number, width:number, height:number) {
  //   this.heightOfChild = height;
  //   this.widthOfChild = width;
  //   this.topOfChild = top;
  //   this.leftOfChild = left;
  // }
}
