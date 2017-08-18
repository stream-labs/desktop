<template>
<modal-layout
  title="Name Source"
  :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      v-if="!error"
      class="NameSource-label">
      Please enter the name of the source
    </p>
    <p
      v-if="error"
      class="NameSource-label NameSource-label__error">
      {{ error }}
    </p>
    <input
      autofocus
      type="text"
      v-model="name"/>
  </form>
</modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowService } from '../../services/window';
import windowMixin from '../mixins/window';
import { IScenesServiceApi } from '../../services/scenes';
import { ISourcesServiceApi } from '../../services/sources';
import { WidgetsService, WidgetDefinitions } from '../../services/widgets';

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class NameSource extends Vue {

  @Inject()
  sourcesService: ISourcesServiceApi;

  @Inject()
  scenesService: IScenesServiceApi;

  @Inject()
  widgetsService:WidgetsService;

  windowService = WindowService.instance;
  name = '';
  error = '';

  mounted() {
    const sourceType =
      this.sourceType &&
      this.sourcesService.getAvailableSourcesTypes()
        .find(sourceTypeDef => sourceTypeDef.value === this.sourceType);

    this.name = this.sourcesService.suggestName(
      (this.sourceType && sourceType.description) || WidgetDefinitions[this.widgetType].name
    );
  }

  submit() {
    if (this.isTaken(this.name)) {
      this.error = 'That name is already taken';
    } else {
      let sourceId: string;

      if (this.sourceType != null) {
        sourceId = this.scenesService.activeScene.createAndAddSource(
          this.name,
          this.sourceType
        ).sourceId;
      } else if (this.widgetType != null) {
        sourceId = this.widgetsService.createWidget(
          this.widgetType,
          this.name
        ).sourceId;
      }

      this.windowService.showSourceProperties(sourceId);
    }
  }

  isTaken(name: string) {
    return this.sourcesService.getSourceByName(name);
  }

  get sourceType() {
    return this.windowService.getOptions().sourceType;
  }

  get widgetType() {
    return this.windowService.getOptions().widgetType;
  }

}
</script>

<style lang="less" scoped>
.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: red;
}
</style>
