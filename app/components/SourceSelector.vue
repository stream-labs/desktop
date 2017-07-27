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
        @click="removeItem"/>
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
    :activeItem="scene.activeItemId"
    @select="makeActive"
    @sort="handleSort">
    <template slot="actions" scope="props">
      <i
        class="fa fa-eye source-selector-visibility"
        :class="visibilityClassesForSource(props.item.value)"
        @click.stop="toggleVisibility(props.item.value)"
        @dblclick.stop="() => {}" />
    </template>
  </selector>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/service';
import Selector from './Selector.vue';
import { WindowService } from '../services/window';
import { ScenesService, SceneItem } from '../services/scenes';
import { EditMenu } from '../util/menus/EditMenu';

@Component({
  components: { Selector }
})
export default class SourceSelector extends Vue {

  @Inject()
  scenesService: ScenesService;

  windowService = WindowService.instance;

  addSource() {
    if (this.scenesService.activeScene) {
      this.windowService.showAddSource();
    }
  }

  showContextMenu(sceneItemId?: string) {
    const sceneItem = this.scene.getItem(sceneItemId);
    const menuOptions = sceneItem ?
      ({
        selectedSceneId: this.scene.id,
        selectedSceneItemId: sceneItemId,
        selectedSourceId: sceneItem.sourceId
      }) :
      ({ selectedSceneId: this.scene.id });

    const menu = new EditMenu(menuOptions);
    menu.popup();
  }

  removeItem() {
    // We can only remove a source if one is selected
    if (this.scene.activeItemId) {
      this.scene.removeItem(this.scene.activeItemId);
    }
  }

  sourceProperties() {
    if (this.scene.activeItemId) {
      this.windowService.showSourceProperties(this.scene.activeItem.sourceId);
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

  makeActive(sceneItemId: string) {
    this.scene.makeItemActive(sceneItemId);
  }

  toggleVisibility(sceneItemId: string) {
    const source = this.scene.getItem(sceneItemId);

    source.setVisibility(!source.visible);
  }

  visibilityClassesForSource(sceneItemId: string) {
    const visible = this.scene.getItem(sceneItemId).visible;

    return {
      'fa-eye': visible,
      'fa-eye-slash': !visible
    };
  }

  get scene() {
    return this.scenesService.activeScene;
  }

  get sources() {
    return this.scene.getItems().map((sceneItem: SceneItem) => {
      return {
        name: sceneItem.name,
        value: sceneItem.sceneItemId
      };
    });
  }

}
</script>

<style lang="less" scoped>
@import "../styles/index";

.source-selector-visibility {
  font-size: 17px;
  .icon-hover;
}
</style>
