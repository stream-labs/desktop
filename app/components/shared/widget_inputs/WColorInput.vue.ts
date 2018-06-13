import Vue from 'vue';
import VueColor from 'vue-color';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Input } from 'aws-sdk/clients/kinesisanalytics';

@Component({
  components: {
    SketchPicker: VueColor.Sketch
  }
})
export default class WidgetColorInput extends Vue {
  @Prop()
  value: string;

  colors = '#194d33';
  colorValue: '';
  displayPicker = false;

  showPicker() {
    document.addEventListener('click', this.documentClick);
    this.displayPicker = true;
  }

  hidePicker() {
    document.removeEventListener('click', this.documentClick);
    this.displayPicker = false;
  }

  updateFromInput(event: any) {
    this.$emit('input', event.target.value);
  }

  updateFromPicker(value: any) {
    this.colors = value.hex;
    this.$emit('input', this.colors);
  }

  documentClick(e: Event) {
    const el = this.$refs.colorpicker;
    const target = e.target;
    if (el !== target) {
      this.hidePicker();
    }
  }
}
