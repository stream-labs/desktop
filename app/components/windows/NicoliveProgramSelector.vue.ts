import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import { LiveProgramInfo } from 'services/platforms/niconico';
import { StreamingService } from 'services/streaming';

@Component({
  components: {
    ModalLayout
  },
})
export default class NicoliveProgramSelector extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() streamingService: StreamingService;

  selectionInfo = (this.windowsService.getChildWindowOptions().queryParams || {}) as LiveProgramInfo;
  selectedId = '';

  get disabledOk() {
    return this.selectedId === '';
  }

  ok() {
    if (this.disabledOk) {
      return;
    }
    this.streamingService.toggleStreamingAsync({programId: this.selectedId});

    this.windowsService.closeChildWindow();
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }
}
