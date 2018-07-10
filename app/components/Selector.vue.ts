import Vue from 'vue';
import _ from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import draggable from 'vuedraggable';

interface ISelectorItem {
  name: string;
  value: string;
}


@Component({
  components: { draggable }
})
export default class Selector extends Vue {

  @Prop()
  items: ISelectorItem[];

  @Prop()
  activeItems: string[];

  @Prop({ default: true })
  draggable: boolean;

  draggableSelector: string = this.draggable ? '.selector-item' : 'none';

  truncateLength: number = 50;

  mounted() {
    window.addEventListener('resize', this.determineTruncateLength);
  }

  destroyed() {
    window.removeEventListener('resize', this.determineTruncateLength);
  }

  determineTruncateLength() {
    const el = document.getElementsByClassName('selector-list')[0];
    if (el.clientWidth >= 528) {
      this.truncateLength = 50;
    } else if (el.clientWidth >= 352) {
      this.truncateLength = 32;
    } else {
      this.truncateLength = 16;
    }
  }

  handleChange(change: any) {
    const order = _.map(this.normalizedItems, item => {
      return item.value;
    });

    this.$emit('sort', {
      change,
      order
    });
  }

  handleSelect(ev: MouseEvent, index: number) {
    const value = this.normalizedItems[index].value;
    this.$emit('select', value, ev);
  }

  handleContextMenu(ev: MouseEvent, index?: number) {
    if (index !== void 0) {
      const value = this.normalizedItems[index].value;
      this.handleSelect(ev, index);
      this.$emit('contextmenu', value);
      return;
    }
    this.$emit('contextmenu');
  }

  handleDoubleClick(ev: MouseEvent, index: number) {
    const value = this.normalizedItems[index].value;
    this.handleSelect(ev, index);
    this.$emit('dblclick', value);
  }

  truncateItemName(name: string) {
    if (name.length <= this.truncateLength) return name;
    return `${name.slice(0, this.truncateLength)}...`;
  }

  /**
   * Items can be either an array of strings, or an
   * array of objects, so we normalize those here.
   */
  get normalizedItems(): ISelectorItem[] {
    return _.map(this.items, item => {
      if (typeof(item) === 'string') {
        return {
          name: item,
          value: item
        };
      }
      return item;
    });
  }

}
