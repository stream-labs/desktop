<template>
<div class="input-container">
  <div class="input-label">
    <label>
      {{ value.description }}
    </label>
  </div>
  <div class="input-wrapper editable-list">
    <div class="editable-list__bar">
      <i
        @click="menu.popup()"
        class="fa fa-plus icon-btn editable-list__control"/>
      <i
        @click="handleRemove"
        class="fa fa-minus icon-btn editable-list__control"/>
      <i
        @click="handleEdit"
        class="fa fa-cog icon-btn editable-list__control"/>
    </div>
    <selector
      class="editable-list__list"
      :items="list"
      :activeItem="activeItem"
      @select="handleSelect"
      @sort="handleSort"/>
  </div>
</div>
</template>

<script lang="ts">
import _ from 'lodash';
import electron from 'electron';
import Selector from '../../Selector.vue';
import { Component, Prop } from 'vue-property-decorator';
import  { IEditableListInputValue, Input, TObsType } from './Input';
import { Menu } from '../../../util/menus/Menu';

interface ISelectorSortEventData {
  change: any;
  order: string[];
}

@Component({
  components: { Selector }
})
class EditableListProperty extends Input<IEditableListInputValue> {

  static obsType: TObsType;

  @Prop()
  value: IEditableListInputValue;

  activeItem = '';
  menu = new Menu();

  created() {
    this.menu.append({
      label: 'Add Files',
      click: () => {
        this.showFileDialog();
      }
    });

    this.menu.append({
      label: 'Add Directory',
      click: () => {
        this.showDirDialog();
      }
    });
  }

  handleSelect(item: string) {
    this.activeItem = item;
  }

  handleSort(data: ISelectorSortEventData) {
    this.setList(data.order);
  }

  handleRemove() {
    this.setList(_.without(this.list, this.activeItem));
  }

  handleEdit() {
    this.showReplaceFileDialog();
  }

  showReplaceFileDialog() {
    const files = electron.remote.dialog.showOpenDialog({
      defaultPath: this.value.defaultPath,
      filters: this.value.filters,
      properties: ['openFile']
    });

    if (files) {
      let activeIndex = _.indexOf(this.list, this.activeItem);

      this.list[activeIndex] = files[0];

      // Preserve this item as active
      this.activeItem = files[0];
      this.setList(this.list);
    }
  }

  showFileDialog() {
    const files = electron.remote.dialog.showOpenDialog({
      defaultPath: this.value.defaultPath,
      filters: this.value.filters,
      properties: ['openFile', 'multiSelections']
    });

    if (files) {
      this.setList(this.list.concat(files));
    }
  }

  showDirDialog() {
    const dir = electron.remote.dialog.showOpenDialog({
      defaultPath: this.value.defaultPath,
      properties: ['openDirectory']
    });

    if (dir) {
      this.setList(this.list.concat(dir));
    }
  }

  setList(list: string[]) {
    this.emitInput({ ...this.value, value: list.map(item => ({ value: item })) });
  }

  get list(): string[] {
    const items = this.value.value || [];
    return _.cloneDeep(items.map(item => item.value ));
  }

}

EditableListProperty.obsType = 'OBS_PROPERTY_EDITABLE_LIST';

export default EditableListProperty;
</script>

<style lang="less" scoped>
@import "../../../styles/index";

.editable-list__list {
  background: @day-input-bg;
  border: 1px solid @day-input-border;
}

.editable-list__bar {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}

.night-theme {
  .editable-list__list {
    border-color: @night-secondary;
    background: @night-secondary;
  }
}
</style>
