import SourceSelector from './SourceSelector.vue';
import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';

@Component({})
export default class SourceSelectorElement extends BaseElement {
  mins = { x: 230, y: 120 };

  get element() {
    return <SourceSelector />;
  }

  render() {
    return this.renderElement();
  }
}
