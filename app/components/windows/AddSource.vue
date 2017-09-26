<template>
<modal-layout
  :showControls="false"
  title="Add Source">

  <div slot="content">


    <div v-if="sourceType != 'scene'">
      <div class="row">
        <div class="column small-12">
          <h4>Add New Source</h4>
          <p
              v-if="!error"
              class="NameSource-label">
            Please enter the name of the source
          </p>
          <p v-if="error"
             class="NameSource-label NameSource-label__error">
            {{ error }}
          </p>
          <input autofocus type="text" v-model="name"/>
        </div>
      </div>
      <div class="row">
        <div class="columns small-12 buttons">
          <button @click="addNew" class="button button--action">Add New Source</button>
        </div>
      </div>
    </div>


    <div class="row">
      <div class="columns small-12">
        <h4>Add Existing Source</h4>
      </div>
    </div>
    <div class="sources-browser row">
      <div class="small-6 columns">
        <selector
            class="studio-controls-selector"
            :draggable="false"
            @dblclick="addExisting"
            @select="sourceId => { selectedSourceId = sourceId }"
            :activeItem="selectedSourceId"
            :items="existingSources">
        </selector>
      </div>
      <div class="small-6 columns">
        <SourcePreview :sourceName="selectedSource.name"/>
      </div>
    </div>

    <div class="row">
      <div class="columns small-12 buttons">
        <button @click="addExisting" class="button button--action">Add Existing Source</button>
      </div>
    </div>


  </div>


</modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { IScenesServiceApi } from '../../services/scenes';
import { ISourcesServiceApi, TSourceType} from '../../services/sources';

import ModalLayout from '../ModalLayout.vue';
import Selector from '../Selector.vue';
import SourcePreview from '../shared/SourcePreview.vue';

@Component({
  components: { ModalLayout, Selector, SourcePreview },
  mixins: [windowMixin]
})
export default class AddSource extends Vue {

  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() scenesService: IScenesServiceApi;
  @Inject() windowsService: WindowsService;

  name = '';
  error = '';
  sourceType = this.windowsService.getChildWindowQueryParams().sourceType as TSourceType;
  sources = this.sourcesService.getSources().filter(source => {
    return (
      source.type === this.sourceType &&
      source.sourceId !== this.scenesService.activeSceneId
    )
  });

  existingSources = this.sources.map(source => {
    return { name: source.displayName, value: source.sourceId }
  });

  selectedSourceId = this.sources[0].sourceId;

  mounted() {
    const sourceType =
      this.sourceType &&
      this.sourcesService.getAvailableSourcesTypes()
        .find(sourceTypeDef => sourceTypeDef.value === this.sourceType);
    this.name = this.sourcesService.suggestName((this.sourceType && sourceType.description));
  }

  addExisting() {
    this.scenesService.activeScene.addSource(this.selectedSourceId);
    this.close();
  }

  close() {
    this.windowsService.closeChildWindow();
  }


  addNew() {
    if (this.isTaken(this.name)) {
      this.error = 'That name is already taken';
    } else {
      const sceneItem = this.scenesService.activeScene.createAndAddSource(
        this.name,
        this.sourceType
      );
      const source = sceneItem.getSource();
      this.close();
      if (source.hasProps()) this.sourcesService.showSourceProperties(source.sourceId);
    }
  }

  isTaken(name: string) {
    return this.sourcesService.getSourceByName(name);
  }

  get selectedSource() {
    return this.sourcesService.getSource(this.selectedSourceId);
  }

}
</script>

<style lang="less" scoped>
@import "../../styles/index";

.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: red;
}

.sources-container {
  padding: 20px;
  display: flex;
  flex: 1 0 auto;
  height: 170px;

  > div {
    flex: 1 0 50%;
  }
}

.sources-browser {

  .columns:first-child {
    display: flex;
  }

  .columns {
    height: 170px;
  }
}

.columns.buttons {
  text-align: right;
  padding-top: 20px;
  padding-bottom: 20px;
}

</style>
