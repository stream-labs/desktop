<template>
<modal-layout
  title="Name Scene"
  :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      v-if="!error"
      class="NameScene-label">
      Please enter the name of the scene
    </p>
    <p
      v-if="error"
      class="NameScene-label NameScene-label__error">
      {{ error }}
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
import windowManager from '../../util/WindowManager';
import namingHelpers from '../../util/NamingHelpers';
import windowMixin from '../mixins/window';
import ScenesService from '../../services/scenes';

export default {

  mixins: [windowMixin],

  components: {
    ModalLayout
  },

  data() {
    return {
      name: namingHelpers.suggestName('New Scene', this.isTaken),
      error: null
    };
  },

  methods: {
    submit() {
      if (this.isTaken(this.name)) {
        this.error = 'That name is already taken';
      } else {
        ScenesService.instance.createScene(this.name);
        windowManager.closeWindow();
      }
    },

    isTaken(name) {
      return ScenesService.instance.getSceneByName(name);
    }
  }

};
</script>

<style lang="less" scoped>
.NameScene-label {
  margin-bottom: 10px;
}

.NameScene-label__error {
  color: red;
}
</style>
