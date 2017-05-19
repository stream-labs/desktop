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
import ScenesService from '../../services/scenes';
import SourcesService from '../../services/sources';

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
        const id = SourcesService.instance.createSourceAndAddToScene(
          ScenesService.instance.activeSceneId,
          this.name,
          this.sourceType
        );

        windowManager.showSourceProperties(id);
      }
    },

    isTaken(name) {
      return SourcesService.instance.getSourceByName(name);
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
