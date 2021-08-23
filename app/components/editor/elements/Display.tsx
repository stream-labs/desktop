import { StudioEditor } from 'components/shared/ReactComponent';
import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';

@Component({})
export default class Display extends BaseElement {
  mins = { x: 0, y: 0 };

  get element() {
    return <StudioEditor />;
  }

  render() {
    return this.renderElement();
  }
}
