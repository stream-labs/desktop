<template>
<div>
  <label>{{ property.description }}</label>
  <div class="PathProperty-fieldGroup">
    <input
      type="text"
      :value="path"
      class="PathProperty-path">
    <button
      @click="showFileDialog"
      class="PathProperty-browse button">
      Browse
    </button>
  </div>
</div>
</template>

<script>
import Property from './Property.vue';
import SourcesService from '../../services/sources';

const { remote } = window.require('electron');

const PathProperty = Property.extend({

  methods: {
    showFileDialog() {
      let props = [];
      let path;

      if (this.property.value.type === 'OBS_PATH_FILE') {
        props.push('openFile');
      }

      if (this.property.value.type === 'OBS_PATH_DIRECTORY') {
        props.push('openDirectory');
      }

      if (this.property.value.type === 'OBS_PATH_FILE_SAVE') {
        path = remote.dialog.showSaveDialog({
          defaultPath: this.property.value.default_path,
          filters: this.property.value.filter
        });
      } else {
        path = remote.dialog.showOpenDialog({
          defaultPath: this.property.value.default_path,
          filters: this.property.value.filter,
          properties: props
        });
      }

      if (path) {
        this.setPath(path);
      }
    },

    setPath(path) {
      SourcesService.instance.setProperty(
        this.property,
        { value: path }
      );
    }
  },

  computed: {
    path() {
      return this.property.value.value;
    }
  }

});
PathProperty.obsType = 'OBS_PROPERTY_PATH';
export default PathProperty;
</script>

<style lang="less" scoped>
.PathProperty-fieldGroup {
  display: flex;
  flex-direction: row;
}

.PathProperty-path {
  flex-grow: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.PathProperty-browse {
  flex-shrink: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
  background-color: #525e65;
}
</style>
