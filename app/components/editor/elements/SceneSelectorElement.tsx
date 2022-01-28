import { SceneSelector } from 'components/shared/ReactComponentList';
import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';

@Component({})
export default class SceneSelectorElement extends BaseElement {
  mins = { x: 200, y: 120 };

  get element() {
    return <SceneSelector />;
  }

  render() {
    return this.renderElement();
  }
}
