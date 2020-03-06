import Display from 'components/shared/Display.vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import Util from 'services/utils';
import BaseElement from './BaseElement';
import { ERenderingMode } from '../../../../obs-api';
import { WindowsService } from 'services/windows';

@Component({})
export default class RecordingPreview extends BaseElement {
  @Inject() windowsService: WindowsService;

  mins = { x: 0, y: 0 };

  get hideStyleBlockers() {
    return this.windowsService.state[this.windowId].hideStyleBlockers;
  }

  get windowId() {
    return Util.getCurrentUrlParams().windowId;
  }

  get element() {
    return (
      !this.hideStyleBlockers && <Display rendering-mode={ERenderingMode.OBS_RECORDING_RENDERING} />
    );
  }

  render() {
    return this.renderElement();
  }
}
