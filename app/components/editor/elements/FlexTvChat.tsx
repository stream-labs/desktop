import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';
import BrowserView from 'components/shared/BrowserView';
import { Inject } from 'services/core';
import Scrollable from 'components/shared/Scrollable';
import styles from './BaseElement.m.less';
import { StreamingService } from '../../../services/streaming';

@Component({})
export default class Display extends BaseElement {
  @Inject() streamingService: StreamingService;

  view: any = null;

  get url() {
    return this.streamingService.views.chatUrl;
  }

  get element() {
    return (
      <div>
        <div class="studio-controls-top">
          <h2 class="studio-controls__label">채팅</h2>
          <div>
            <i
              class="icon-repeat icon-button"
              onClick={() => {
                if (!this.view) return;
                this.view.webContents.reload();
              }}
            />
          </div>
        </div>
        <Scrollable className="studio-controls-selector">
          <div style="height: 100%;">
            <BrowserView
              class={styles.container}
              src={this.url}
              options={{ webPreferences: { contextIsolation: true } }}
              onReady={view => {
                this.view = view;
              }}
            />
          </div>
        </Scrollable>
      </div>
    );
  }

  render() {
    return this.renderElement();
  }
}
