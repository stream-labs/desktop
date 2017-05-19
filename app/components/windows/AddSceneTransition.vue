<template>
  <modal-layout
    title="Add transition"
    :done-handler="done"
    :cancel-handler="cancel"
  >

    <div slot="content">
      <TextInput v-model="form.name"></TextInput>
      <ListInput v-model="form.type"></ListInput>
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

export default {

  mixins: [windowMixin],

  components: Object.assign({
    ModalLayout
  }, inputComponents),

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
