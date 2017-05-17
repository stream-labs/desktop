<template>
<modal-layout
  title="Scene transition"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-8">
        <ListInput :value="form.currentName" @input="onInputHandler"></ListInput>
      </div>
      <div class="columns small-4 controls">
        <div class="fa fa-plus studioControls-button" @click="addTransition"></div>
        <div
          class="fa fa-minus studioControls-button"
          @click="removeTransition" v-if="state.availableNames.length > 1">
        </div>
        <div class="fa fa-cog studioControls-button" @click="setupTransition" v-if="state.properties.length"></div>
      </div>
    </div>
    <div class="row">
      <div class="columns small-12">
        <IntInput :value="form.duration" @input="onInputHandler"></IntInput>
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import * as inputComponents from '../shared/forms';
import windowManager from '../../util/WindowManager';
import windowMixin from '../mixins/window';


export default {

  mixins: [windowMixin],

  components: Object.assign({
    ModalLayout
  }, inputComponents),

  computed: {
    form() {
      return this.$store.getters.sceneTransitionsFormData;
    },
    state() {
      return this.$store.state.sceneTransitions;
    }
  },

  methods: {

    onInputHandler(value) {
      this.$store.dispatch('setCurrentSceneTransition', { [value.name]: value.value });
    },

    addTransition() {
      windowManager.showAddSceneTransition();
    },

    setupTransition() {
      windowManager.showSceneTransitionProperties(this.state.currentName);
    },

    removeTransition() {
      this.$store.dispatch('removeSceneTransition', { name: this.state.currentName });
    },

    done() {
      windowManager.closeWindow();
    }
  }
};
</script>

<style lang="less" scoped>
  .controls {
    padding-top: 30px;
  }
</style>
