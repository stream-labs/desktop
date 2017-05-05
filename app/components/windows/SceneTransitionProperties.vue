<template>
  <modal-layout
    title="Transition properties"
    :done-handler="done"
    :cancel-handler="cancel"
  >

    <div slot="content">
      <GenericForm v-model="properties"></GenericForm>
    </div>

  </modal-layout>
</template>

<script>
  import ModalLayout from '../ModalLayout.vue';
  import * as inputComponents from '../shared/forms';
  import GenericForm from '../shared/forms/GenericForm.vue';
  import windowManager from '../../util/WindowManager';
  import windowMixin from '../mixins/window';

  export default {

    mixins: [windowMixin],

    components: Object.assign({
      ModalLayout,
      GenericForm
    }, inputComponents),


    data() {
      return {
        properties: this.$store.getters.sceneTransitionsPropertiesFormData
      };
    },


    methods: {

      done() {
        this.$store.dispatch({
          type: 'setSceneTransitionProperties',
          properties: this.properties
        });

        windowManager.showSceneTransitions();
      },

      cancel() {
        windowManager.showSceneTransitions();
      }
    }
  };
</script>

<style lang="less" scoped>

</style>
