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

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowService } from '../../services/window';
import namingHelpers from '../../util/NamingHelpers';
import windowMixin from '../mixins/window';
import { IScenesServiceApi } from '../../services/scenes';

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class NameScene extends Vue {

  name = '';
  error = '';

  @Inject()
  scenesService: IScenesServiceApi;

  windowService = WindowService.instance;

  options: { sceneToDuplicate?: string } = this.windowService.getOptions();

  mounted() {
    const suggestedName = this.options.sceneToDuplicate || 'NewScene';
    this.name = namingHelpers.suggestName(
      suggestedName, (name: string) => this.isTaken(name)
    );
  }

  submit() {
    if (this.isTaken(this.name)) {
      this.error = 'That name is already taken';
    } else {
      this.scenesService.createScene(
        this.name,
        {
          duplicateSourcesFromScene: this.options.sceneToDuplicate,
          makeActive: true
        }
      );
      this.windowService.closeWindow();
    }
  }

  isTaken(name: string) {
    return this.scenesService.getSceneByName(name);
  }

}
</script>

<style lang="less" scoped>
.NameScene-label {
  margin-bottom: 10px;
}

.NameScene-label__error {
  color: red;
}
</style>
