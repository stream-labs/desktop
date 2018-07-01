import Vue from 'vue';
import Slider from '../Slider.vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Component({
  components: {
    Slider,
  }
})
export default class WidgetColorInput extends Vue {
  @Prop()
  value: number;
}
