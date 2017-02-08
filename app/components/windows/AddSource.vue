<template>
<div>
  <title-bar
    class="AddSource-titleBar"
    window-title="Add Source" />
  <div class="AddSource-content">
    <h4 class="AddSource-heading">
      Standard
    </h4>
    <ul>
      <li v-for="source in availableSources">
        {{ source }}
      </li>
    </ul>
  </div>
</div>
</template>

<script>
import TitleBar from '../TitleBar.vue';
import windowManager from '../../util/WindowManager.js';
import Obs from '../../api/Obs.js';

export default {

  components: {
    TitleBar
  },

  methods: {

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
</style>
