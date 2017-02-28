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
  <ul class="EditableList-list">
    <draggable
      :list="list"
      :options="draggableOptions"
      @change="handleChange">
      <li 
        class="EditableList-item"
        :class="{ 'EditableList-item__active': index === selectedIndex }"
        v-for="(item, index) in list"
        @click="handleSelect(index)">
        <div class="EditableList-itemText">
          {{item}}
        </div>
        <div class="EditableList-dragHandle">
          <i class="fa fa-bars fa-rotate-90"/>
        </div>
      </li>
    </draggable>
  </ul>
</div>
</template>

<script>
import contextManager from '../../util/ContextMenuManager.js';
import Draggable from 'vuedraggable';
import _ from 'lodash';

const { remote } = window.require('electron');

export default {

  components: {
    Draggable
  },

  props: [
    'property'
  ],

  data() {
    return {
      testList: [
        '/Users/andycreeth/Downloads/foundation-6.3.0-complete/css/foundation.min.css',
        '/Users/andycreeth/Downloads/foundation-6.3.0-complete/foundation-6.3.0-complete/css/foundation.min.css',
        '/Users/andycreeth/Downloads/foundation-6.3.0-complete/foundation-6.3.0-complete/foundation-6.3.0-complete/foundation-6.3.0-complete/css/foundation.min.css'
      ],

      draggableOptions: {
        handle: '.EditableList-dragHandle'
      },

      selectedIndex: 0
    };
  },

  methods: {
    handleChange(change) {
      this.setList(this.list);
      let oldI = change.moved.oldIndex;
      let newI = change.moved.newIndex;

      // Adjust the selected index based on what moved
      if (change.moved) {
        if (oldI === this.selectedIndex) {
          this.selectedIndex = newI;
        } else if ((oldI < this.selectedIndex) && (newI >= this.selectedIndex)) {
          this.selectedIndex -= 1;
        } else if ((oldI > this.selectedIndex) && (newI <= this.selectedIndex)) {
          this.selectedIndex += 1;
        }
      }
    },

    handleSelect(index) {
      this.selectedIndex = index;
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
      this.list.splice(this.selectedIndex, 1);
      this.setList(this.list);
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
        this.list[this.selectedIndex] = files[0];
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
.sortable-ghost {
  opacity: 0;
}

.sortable-drag {
  border: 1px solid #ddd;
  background-color: #eee;
}

.EditableList-topBar {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}

.EditableList-label {
  flex-grow: 1;
}

.EditableList-list {
  list-style-type: none;
  margin: 0;
  overflow: auto;
  height: 180px;
  border: 1px solid #ddd;

  background-color: #fcfcfc;
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

.EditableList-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #ddd;

  cursor: pointer;

  &.EditableList-item__active {
    background-color: #1ae6a8;
    color: white;

    .EditableList-dragHandle {
      color: white;
    }
  }

  &:hover {
    .EditableList-dragHandle {
      opacity: 1;
    }
  }
}

.EditableList-itemText {
  flex-grow: 1;
}

.EditableList-dragHandle {
  color: #ccc;
  cursor: move;
  font-size: 12px;
  padding: 0 5px;
  opacity: 0;
}
</style>
