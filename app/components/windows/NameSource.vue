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

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager';
import namingHelpers from '../../util/NamingHelpers';
import windowMixin from '../mixins/window';
import { ScenesService } from '../../services/scenes';
import { SourcesService } from '../../services/sources';

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class NameSource extends Vue {

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  scenesService: ScenesService;

  name = '';
  error = '';

  mounted() {
    this.name = namingHelpers.suggestName(
      this.$store.state.windowOptions.options.sourceType,
      (name: string) => this.isTaken(name)
    );
  }

  submit() {
    if (this.isTaken(this.name)) {
      this.error = 'That name is already taken';
    } else {
      const id = this.scenesService.createSourceAndAddToScene(
        this.scenesService.activeSceneId,
        this.name,
        this.sourceType
      );

      windowManager.showSourceProperties(id);
    }
  }

  isTaken(name: string) {
    return this.sourcesService.getSourceByName(name);
  }

  get sourceType() {
    return this.$store.state.windowOptions.options.sourceType;
  }

}
</script>

<style lang="less" scoped>
.NameSource-label {
  margin-bottom: 10px;
}

.NameSource-label__error {
  color: red;
}
</style>
