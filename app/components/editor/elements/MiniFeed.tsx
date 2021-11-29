import { Component } from 'vue-property-decorator';
import { RecentEvents } from 'components/shared/ReactComponentList';
import BaseElement from './BaseElement';

@Component({})
export default class MiniFeed extends BaseElement {
  mins = { x: 330, y: 90 };

  get element() {
    return <RecentEvents componentProps={{ isOverlay: false }} />;
  }

  render() {
    return this.renderElement();
  }
}
