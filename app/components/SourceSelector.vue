<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Sources
    </h4>
    <div>
      <i
        class="fa fa-plus ico-btn"
        @click="addSource"/>
      <i
        class="fa fa-minus ico-btn"
        @click="removeSource"/>
      <i
        class="fa fa-cog ico-btn"
        @click="sourceProperties"/>
    </div>
  </div>
  <selector
    class="studio-controls-selector"
    @contextmenu="showContextMenu"
    @dblclick="sourceProperties"
    :items="sources"
    :activeItem="scene.activeSourceId"
    @select="makeActive"
    @sort="handleSort"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/service';
import Selector from './Selector.vue';
import windowManager from '../util/WindowManager';
import { ScenesService } from '../services/scenes';
import { ISource, SourcesService } from '../services/sources';
import { SourceMenu } from '../util/menus/SourceMenu';

@Component({
  components: { Selector }
})
export default class SourceSelector extends Vue {

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  scenesService: ScenesService;


  addSource() {
    if (this.scenesService.activeScene) {
      windowManager.showAddSource();
    }
  }


  showContextMenu(sourceId: string) {
    const menu = new SourceMenu(
      this.scenesService.activeSceneId,
      sourceId
    );
    menu.popup();
  }


  removeSource() {
    // We can only remove a source if one is selected
    if (this.scene.activeSourceId) {
      this.sourcesService.removeSource(this.scene.activeSourceId);
    }
  }


  sourceProperties() {
    if (this.scene.activeSourceId) {
      windowManager.showSourceProperties(this.scene.activeSourceId);
    }
  }


  handleSort(data: any) {
    const positionDelta = data.change.moved.newIndex - data.change.moved.oldIndex;

    this.scenesService.activeScene.setSourceOrder(
      data.change.moved.element.value,
      positionDelta,
      data.order
    );
  }


  makeActive(sourceId: string) {
    this.scene.makeSourceActive(sourceId);
  }

  get scene() {
    return this.scenesService.activeScene;
  }

  get sources() {
    return this.scene.getSources().map((source: ISource) => {
      return {
        name: source.name,
        value: source.id
      };
    });
  }

}
</script>
