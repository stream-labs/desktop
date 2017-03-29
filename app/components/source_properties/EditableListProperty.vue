<template>
<div>
  <div class="EditableList-topBar">
    <label class="EditableList-label">
      {{ property.description }}
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

<script>
import contextManager from '../../util/ContextMenuManager.js';
import Selector from '../Selector.vue';
import _ from 'lodash';

const { remote } = window.require('electron');

export default {

  components: {
    Selector
  },

  props: [
    'property'
  ],

  data() {
    return {
      activeItem: null
    };
  },

  methods: {
    handleSelect(item) {
      this.activeItem = item;
    },

    handleSort(data) {
      this.setList(data.order);
    },

    handleAdd(event) {
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
    },

    handleRemove() {
      this.setList(_.without(this.list, this.activeItem));
    },

    handleEdit() {
      this.showReplaceFileDialog();
    },

    showReplaceFileDialog() {
      let files = remote.dialog.showOpenDialog({
        defaultPath: this.property.value.default_path,
        filters: this.property.value.filter,
        properties: ['openFile']
      });

      if (files) {
        let activeIndex = _.indexOf(this.list, this.activeItem);

        this.list[activeIndex] = files[0];

        // Preserve this item as active
        this.activeItem = files[0];
        this.setList(this.list);
      }
    },

    showFileDialog() {
      let files = remote.dialog.showOpenDialog({
        defaultPath: this.property.value.default_path,
        filters: this.property.value.filter,
        properties: ['openFile', 'multiSelections']
      });

      if (files) {
        this.setList(this.list.concat(files));
      }
    },

    showDirDialog() {
      let dir = remote.dialog.showOpenDialog({
        defaultPath: this.property.value.default_path,
        properties: ['openDirectory']
      });

      if (dir) {
        this.setList(this.list.concat(dir));
      }
    },

    setList(list) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: {
          valuesArray: list
        }
      });
    }
  },

  computed: {
    list() {
      return _.cloneDeep(this.property.value.valuesArray);
    }
  }

};
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
