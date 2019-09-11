import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({})

export default class NavItem extends Vue {

  @Prop()
  to: string;

  @Prop()
  ico: string;

  @Prop({ default: true, type: Boolean })
  enabled: boolean;

  navMenu = this.$parent as any as { value: string; setValue: (value: string) => void };

  get value() { return this.navMenu.value; }

  onClickHandler() {
    if (!this.enabled) return;
    this.navMenu.setValue(this.to);
  }

  onIconClickHandler(event: MouseEvent) {
    if (!this.enabled) return;
    this.$emit('iconClick', this.to);
    event.stopPropagation();
  }

}
