import StudioEditor from 'components/StudioEditor.vue';
import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';

@Component({})
export default class Display extends BaseElement {
  mins = { x: 350, y: 250 };

  get element() {
    return <StudioEditor />;
  }

  render() {
    return this.renderElement();
  }
}
