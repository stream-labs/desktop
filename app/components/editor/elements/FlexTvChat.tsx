import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';
import BrowserView from 'components/shared/BrowserView';
import { Inject } from 'services/core';
import { StreamingService } from '../../../services/streaming';

@Component({})
export default class Display extends BaseElement {
  @Inject() streamingService: StreamingService;

  get url() {
    return this.streamingService.views.chatUrl;
  }

  get element() {
    return <BrowserView src={this.url} options={{ webPreferences: { contextIsolation: true } }} />;
  }

  render() {
    return this.renderElement();
  }
}
