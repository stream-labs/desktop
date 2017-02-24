<template>
<div>
  <label>{{ property.description }}</label>
  EDITABLE LIST
  <button @click="handleAdd">ADD</button>
</div>
</template>

<script>
import contextManager from '../../util/ContextMenuManager.js';

export default {

  props: [
    'property'
  ],

  methods: {
    setValue(event) {
      // this.$store.dispatch({
      //   type: 'setSourceProperty',
      //   property: this.property,
      //   propertyValue: {
      //     value: event.target.value
      //   }
      // });
    },

    openFileDialog() {
      console.log("OPEN FILE");
    },

    openDirDialog() {
      console.log("OPEN DIR");
    },

    handleAdd(event) {
      contextManager.showMenu(
        [
          {
            type: 'action',
            label: 'Add Files',
            handler: this.openFileDialog
          },
          {
            type: 'action',
            label: 'Add Directory',
            handler: this.openDirDialog
          }
        ],
        {
          mouseEvent: event
        }
      );
    }
  }

};
</script>
