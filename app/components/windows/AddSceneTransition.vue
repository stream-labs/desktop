<template>
  <modal-layout
    title="Add transition"
    :done-handler="done"
    :cancel-handler="cancel"
  >

    <div slot="content">
      <ListInput v-model="form.type" @input="setTypeAsName"></ListInput>
      <TextInput v-model="form.name"></TextInput>
      <p v-if="error" style="color: red">
        {{ error }}
      </p>

    </div>

  </modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager.js';
import windowMixin from '../mixins/window';
import * as inputComponents from '../shared/forms';
import namingHelpers from '../../util/NamingHelpers';

export default {

  mixins: [windowMixin],

  components: Object.assign({
    ModalLayout
  }, inputComponents),

  mounted() {
    this.setTypeAsName();
  },

  methods: {

    done() {
      const name = this.form.name.value;
      this.error = this.validateName(name);
      if (this.error) return;

      this.$store.dispatch({
        type: 'addSceneTransition',
        transitionName: name,
        transitionType: this.form.type.value
      });

      if (this.state.properties.length) {
        windowManager.showSceneTransitionProperties(name);
      } else {
        windowManager.showSceneTransitions();
      }
    },

    cancel() {
      windowManager.showSceneTransitions();
    },

    validateName(name) {
      if (!name) return 'Name is required';
      if (this.state.availableNames.includes(name)) return 'That name is already taken';
      return '';
    },

    setTypeAsName() {
      const name = this.state.availableTypes.find(({ type }) => {
        return type === this.form.type.value;
      }).description;
      this.form.name.value = namingHelpers.suggestName(
        name, suggestedName => this.validateName(suggestedName)
      );
    }
  },

  data() {
    return {
      form: this.$store.getters.sceneTransitionsAddNewFormData,
      error: ''
    };
  },

  computed: {
    state() { return this.$store.state.sceneTransitions; }
  }

};
</script>
