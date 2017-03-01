<template>
<modal-layout title="Add Source">
  <div slot="content">
    <h4 class="AddSource-heading">
      Standard
    </h4>
    <ul class="AddSource-sourceList">
      <li
        v-for="source in availableSources"
        class="AddSource-source"
        @click="selectSource(source)">
        {{ source }}
      </li>
    </ul>
  </div>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager.js';
import Obs from '../../api/Obs.js';

export default {

  components: {
    ModalLayout
  },

  methods: {
    selectSource(source) {
      windowManager.showNameSource(source);
    }
  },

  data() {
    return {
      availableSources: Obs.availableSources()
    };
  }

};
</script>

<style lang="less" scoped>
.AddSource-titleBar {
  border-bottom: 1px solid #eee;
}

.AddSource-content {
  padding: 30px;
  background-color: #fcfcfc;
}

.AddSource-heading {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 1px;
  color: #777;
}

.AddSource-sourceList {
  list-style-type: none;
  margin: 0;
}

.AddSource-source {
  cursor: pointer;

  &:hover {
    background-color: #eee;
  }
}
</style>
