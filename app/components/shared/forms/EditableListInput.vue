<template>
<div>
  <div class="EditableList-topBar">
    <label class="EditableList-label">
      {{ value.description }}
    </label>
    <i
      @click="handleAdd"
      class="fa fa-plus EditableList-control"/>
    <i
      @click="handleRemove"
      class="fa fa-minus EditableList-control"/>
    <i
      @click="handleEdit"
      class="fa fa-cog EditableList-control"/>
  </div>
  <selector
    class="EditableList-list"
    :items="list"
    :activeItem="activeItem"
    @select="handleSelect"
    @sort="handleSort"/>
</div>
</template>

<script lang="ts">
import _ from 'lodash';
import electron from '../../../vendor/electron';
import contextManager from '../../../util/ContextMenuManager';
import Selector from '../../Selector.vue';
import { Component, Prop } from 'vue-property-decorator';
import  { IEditableListInputValue, Input, TObsType } from './Input';


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

  handleSelect(item: string) {
    this.activeItem = item;
  }

  handleSort(data: ISelectorSortEventData) {
    this.setList(data.order);
  }

  handleAdd(event: MouseEvent) {
    contextManager.showMenu(
      [
        {
          type: 'action',
          label: 'Add Files',
          handler: this.showFileDialog
        },
        {
          type: 'action',
          label: 'Add Directory',
          handler: this.showDirDialog
        }
      ],
      {
        mouseEvent: event
      }
    );
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
    this.emitInput({ ...this.value, value: { valuesArray: list } });
  }


  get list(): string[] {
    return _.cloneDeep(this.value.value.valuesArray);
  }

}

EditableListProperty.obsType = 'OBS_PROPERTY_EDITABLE_LIST';
export default EditableListProperty;

</script>

<style lang="less" scoped>
.EditableList-topBar {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}

.EditableList-label {
  flex-grow: 1;
}

.EditableList-list {
  height: 180px;
}

.EditableList-control {
  color: #999;
  opacity: 0.6;
  cursor: pointer;

  font-size: 16px;
  margin-left: 15px;

  &:hover {
    opacity: 1;
  }
}
</style>
