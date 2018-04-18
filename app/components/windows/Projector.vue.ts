import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import SourcePreview from 'components/shared/SourcePreview.vue';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';

@Component({
  components: {
    ModalLayout,
    SourcePreview
  }
})
export default class Projector extends Vue {
  @Inject() windowsService: WindowsService;

  get sourceId() {
    return this.windowsService.getCurrentWindowOptions().sourceId;
  }

}
