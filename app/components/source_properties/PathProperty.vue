<template>
<div>
  <label>{{ property.description }}</label>
  <button @click="showFileDialog">Browse</button>
</div>
</template>

<script>
const { remote } = window.require('electron');
import _ from 'lodash';

export default {

  props: [
    'property'
  ],

  methods: {
    showFileDialog() {
      console.log(_.cloneDeep(this.property.value.filter));
      remote.dialog.showOpenDialog({
        filters: this.property.value.filter,
        properties: ['openFile']
      });
    },

    setValue(event) {
      // this.$store.dispatch({
      //   type: 'setSourceProperty',
      //   property: this.property,
      //   propertyValue: {
      //     value: event.target.value
      //   }
      // });
    }
  }

};
</script>
