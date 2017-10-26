<template>
<modal-layout
  :show-controls="false"
  title="Add Source">
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

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager';
import Obs from '../../api/Obs';
import windowMixin from '../mixins/window';

@Component({
  components: { ModalLayout },
  mixins: [windowMixin],
})
export default class AddSource extends Vue {

  availableSources = Obs.availableSources();

  selectSource(sourceName: string) {
    windowManager.showNameSource(sourceName);
  }

}
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
