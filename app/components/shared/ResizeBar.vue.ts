import Vue from 'vue';
import { Component, Emit, Prop } from 'vue-property-decorator';

@Component({})
export default class ResizeBar extends Vue {

  @Prop({default: 'left'})
  position: 'left' | 'right' | 'top';

  active = false;
  offset = 0;
  transform = '';

  onMouseDownHandler(event: MouseEvent) {
    this.startMouseTracking(event);
  }

  startMouseTracking(event: MouseEvent) {
    this.active = true;
    const mouseMoveListener = (event: MouseEvent) => this.onMouseMoveHandler(event);
    this.$root.$el.addEventListener('mousemove', mouseMoveListener);
    this.$root.$el.addEventListener('mouseup', (event) => {
        this.$root.$el.removeEventListener('mousemove', mouseMoveListener);
        this.stopMouseTracking(event)
      },
      { once: true}
    );
    this.$emit('onresizestart', event);
  }

  stopMouseTracking(event: MouseEvent) {
    this.$root.$off('mousemove', this.onMouseMoveHandler);
    this.active = false;
    const offset = this.offset;
    this.offset = 0;
    this.updateTransform();
    this.$emit('onresizestop', offset, event);
  }

  onMouseMoveHandler(event: MouseEvent) {
    this.offset += event.movementX;
    this.updateTransform();
  }

  private updateTransform() {
    this.transform = `translateX(${this.offset}px)`;
  }
}
