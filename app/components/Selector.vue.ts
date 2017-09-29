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
  activeItem: string;

  @Prop({ default: true })
  draggable: boolean;

  draggableSelector: string = this.draggable ? '.selector-item' : 'none';

  handleChange(change: any) {
    let order = _.map(this.normalizedItems, item => {
      return item.value;
    });

    this.$emit('sort', {
      change,
      order
    });
  }

  handleSelect(index: number) {
    let value = this.normalizedItems[index].value;
    this.$emit('select', value);
  }

  handleContextMenu(index?: number) {
    if (index !== void 0) {
      const value = this.normalizedItems[index].value;
      this.handleSelect(index);
      this.$emit('contextmenu', value);
      return;
    }
    this.$emit('contextmenu');
  }

  handleDoubleClick(index: number) {
    const value = this.normalizedItems[index].value;
    this.handleSelect(index);
    this.$emit('dblclick', value);
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
      } else {
        return item;
      }
    });
  }

}
