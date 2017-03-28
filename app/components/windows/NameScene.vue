<template>
<modal-layout
  title="Name Scene"
  :show-controls="true"
  :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      class="NameScene-label">
      Please enter the name of the scene
    </p>
    <input
      autofocus
      type="text"
      v-model="name"/>
  </form>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager.js';
import namingHelpers from '../../util/NamingHelpers.js';

export default {

  components: {
    ModalLayout
  },

  data() {
    return {
      name: namingHelpers.suggestName('New Scene', name => {
        return this.$store.getters.sceneByName(name);
      })
    };
  },

  methods: {
    submit() {
      this.$store.dispatch({
        type: 'createNewScene',
        sceneName: this.name
      });

      windowManager.closeWindow();
    }
  }

};
</script>

<style lang="less" scoped>
.NameScene-label {
  margin-bottom: 10px;
}
</style>
