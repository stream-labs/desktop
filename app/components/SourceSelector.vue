<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Sources
    </h4>
    <div>
      <i
        class="fa fa-plus icon-btn icon-btn--lg"
        @click="addSource"/>
      <i
        class="fa fa-minus icon-btn icon-btn--lg"
        :class="{ disabled: !this.scene.activeItemId}"
        @click="removeItem"/>
      <i
        :class="{ disabled: !canShowProperties()}"
        class="fa fa-cog icon-btn"
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
        class="fa fa-lock icon-btn source-selector-action"
        :class="lockClassesForSource(props.item.value)"
        @click.stop="toggleLock(props.item.value)"
        @dblclick.stop="() => {}" />
      <i
        class="fa fa-eye icon-btn source-selector-action"
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
import { Inject } from '../util/injector';
import Selector from './Selector.vue';
import { SourcesService } from '../services/sources';
import { ScenesService, SceneItem } from '../services/scenes';
import { EditMenu } from '../util/menus/EditMenu';

@Component({
  components: { Selector }
})
export default class SourceSelector extends Vue {

  @Inject()
  scenesService: ScenesService;

  @Inject()
  sourcesService: SourcesService;

  addSource() {
    if (this.scenesService.activeScene) {
      this.sourcesService.showShowcase();
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
    if (!this.canShowProperties()) return;
    this.sourcesService.showSourceProperties(this.scene.activeItem.sourceId);
  }

  canShowProperties(): boolean {
    return this.scene.activeItemId && this.scene.activeItem.getSource().hasProps();
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

  lockClassesForSource(sceneItemId: string) {
    const locked = this.scene.getItem(sceneItemId).locked;

    return {
      'fa-lock': locked,
      'fa-unlock': !locked
    };
  }

  toggleLock(sceneItemId: string) {
    const item = this.scene.getItem(sceneItemId);
    item.setLocked(!item.locked);
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

.source-selector-action {
  font-size: 16px;
}

.fa.disabled {
  opacity: 0.15;
  cursor: inherit;
  :hover {
    opacity: inherit;
  }
}
</style>
