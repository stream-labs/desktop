import StudioEditor from 'components/StudioEditor.vue';
import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';
import BrowserView from 'components/shared/BrowserView';
import { LayoutService, ELayoutElement } from 'services/layout';
import { Inject } from 'services/core';

@Component({})
export default class Display extends BaseElement {
  @Inject() layoutService: LayoutService;
  mins = { x: 0, y: 0 };

  get url() {
    const src = this.layoutService.views.currentTab.slottedElements[ELayoutElement.Browser].src;
    if (!/^https?\:\/\//.test(src)) {
      return `https://${src}`;
    }
    return src;
  }

  get element() {
    return <BrowserView src={this.url} />;
  }

  render() {
    return this.renderElement();
  }
}
