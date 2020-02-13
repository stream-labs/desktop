import SourceSelector from './SourceSelector.vue';
import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';

@Component({})
export default class SourceSelectorElement extends BaseElement {
  mins = { x: 220, y: 150 };

  get element() {
    return <SourceSelector />;
  }

  render() {
    return this.renderElement();
  }
}
