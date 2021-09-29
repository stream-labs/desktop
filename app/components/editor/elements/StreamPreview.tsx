import { Display } from 'components/shared/ReactComponentList';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import Util from 'services/utils';
import BaseElement from './BaseElement';
import { ERenderingMode } from '../../../../obs-api';
import { WindowsService } from 'services/windows';
import styles from './BaseElement.m.less';
import { $t } from 'services/i18n';
import { StreamingService } from 'services/streaming';

@Component({})
export default class StreamPreview extends BaseElement {
  @Inject() windowsService: WindowsService;
  @Inject() streamingService: StreamingService;

  mins = { x: 0, y: 0 };

  get hideStyleBlockers() {
    return this.windowsService.state[this.windowId].hideStyleBlockers;
  }

  get windowId() {
    return Util.getCurrentUrlParams().windowId;
  }

  get selectiveRecordingMessage() {
    return (
      <div class={styles.container}>
        <span class={styles.empty}>
          {$t('This element requires Selective Recording to be enabled')}
        </span>
      </div>
    );
  }

  get element() {
    if (!this.streamingService.state.selectiveRecording) return this.selectiveRecordingMessage;
    if (this.hideStyleBlockers) return <div />;
    return <Display componentProps={{ renderingMode: ERenderingMode.OBS_STREAMING_RENDERING }} />;
  }

  render() {
    return this.renderElement();
  }
}
