import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import Display from 'components/shared/Display.vue';
import { TransitionsService } from 'services/transitions';
import { EditorService, IMouseEvent } from 'services/editor';
import { throttle } from 'lodash-decorators';

@Component({
  components: { Display },
})
export default class StudioEditor extends Vue {
  @Inject() private editorService: EditorService;
  @Inject() private transitionsService: TransitionsService;

  get cursor() {
    return this.editorService.state.cursor;
  }

  get studioMode() {
    return this.transitionsService.state.studioMode;
  }

  // Not reactive, don't cache
  getStudioTransitionName() {
    return this.transitionsService.studioTransitionName;
  }

  onOutputResize(region: IRectangle) {
    this.editorService.handleOutputResize(region);
  }

  handleMouseDown(event: MouseEvent) {
    this.editorService.handleMouseDown(this.getMouseEvent(event));
  }

  handleMouseDblClick(event: MouseEvent) {
    this.editorService.handleMouseDblClick(this.getMouseEvent(event));
  }

  handleMouseUp(event: MouseEvent) {
    this.editorService.handleMouseUp(this.getMouseEvent(event));
  }

  handleMouseEnter(event: MouseEvent) {
    this.editorService.handleMouseEnter(this.getMouseEvent(event));
  }

  handleMouseMove(event: MouseEvent) {
    this.throttledHandleMouseMove(event);
  }

  @throttle(20)
  throttledHandleMouseMove(event: MouseEvent) {
    this.editorService.handleMouseMove(this.getMouseEvent(event));
  }

  getMouseEvent(event: MouseEvent): IMouseEvent {
    return {
      offsetX: event.offsetX,
      offsetY: event.offsetY,
      pageX: event.pageX,
      pageY: event.pageY,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      button: event.button,
      buttons: event.buttons,
    };
  }
}
