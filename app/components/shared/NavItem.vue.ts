import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { httpify } from 'caseless';

@Component({})

export default class NavItem extends Vue {

  @Prop()
  to: string;

  @Prop()
  ico: string;

  @Prop({ default: true })
  enabled: boolean;

  expanded = false;

  get value() { return this.navMenu.value; }

  onClickHandler(event: MouseEvent) {
    if (!this.enabled) return;
    if (this.expandable) {
      this.expanded = !this.expanded;
      return;
    };
    this.navMenu.setValue(this.to);
    event.stopPropagation();
  }

  onIconClickHandler(event: MouseEvent) {
    if (!this.enabled) return;
    this.$emit('iconClick', this.to);
    event.stopPropagation();
  }

  get isChild() {
    debugger;
    return this.$parent['isChild'];
  }

  get navMenu() {
    return (this.$parent as any) as { value: string; setValue: (value: string) => void };
  }

  get expandable() {
    return !!this.$slots['children'];
  }

}
