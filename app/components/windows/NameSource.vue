<template>
<modal-layout
  title="Name Source"
  :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      v-if="!error"
      class="NameSource-label">
      Please enter the name of the source
    </p>
    <p
      v-if="error"
      class="NameSource-label NameSource-label__error">
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

const { ipcRenderer } = window.require('electron');

export default {

  mixins: [windowMixin],

  components: {
    ModalLayout
  },

  methods: {
    submit() {
      if (this.isTaken(this.name)) {
        this.error = 'That name is already taken';
      } else {
        // Choose a unique id for the source
        const id = ipcRenderer.sendSync('getUniqueId');

        this.$store.dispatch({
          type: 'createSourceAndAddToScene',
          sceneName: this.$store.getters.activeSceneName,
          sourceType: this.sourceType,
          sourceName: this.name,
          sourceId: id
        });

        windowManager.showSourceProperties(id);
      }
    },

    isTaken(name) {
      return this.$store.getters.sourceByName(name);
    }
  },

  data() {
    return {
      name: namingHelpers.suggestName(this.$store.state.windowOptions.options.sourceType, this.isTaken),
      error: null
    };
  },

  computed: {
    sourceType() {
      return this.$store.state.windowOptions.options.sourceType;
    }
  }

};
</script>

<style lang="less" scoped>
.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: red;
}
</style>
