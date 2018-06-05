import Vue from 'vue';
import VueColor from 'vue-color';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

@Component({
  components: {
    ColorPicker: VueColor.Sketch
  }
})
export default class WidgetColorInput extends Vue {
  @Prop()
  value: string;

  colors: {
    hex: string,
    a?: string;
  };

  displayPicker: boolean = false;

  showPicker() {
    document.addEventListener('click', this.documentClick);
    this.displayPicker = true;
  }

  hidePicker() {
    document.removeEventListener('click', this.documentClick);
    this.displayPicker = false;
  }

  togglePicker() {
    this.displayPicker ? this.hidePicker() : this.showPicker();
  }

  updateFromInput(event: any) {
    this.$emit('input', event.target.value);
  }

  updateFromPicker(value: any) {
    this.colors = value;
  }

  documentClick(e: any) {
    const el = this.$refs.colorpicker;
    const target = e.target;
    if (el !== target) {
      this.hidePicker();
    }
  }

}
