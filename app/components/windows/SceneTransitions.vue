<template>
<modal-layout
  title="Scene transition"
  :done-handler="done">

  <div slot="content">
    <ListInput
      v-model="form.type"
      @input="setTransitionType"/>

    <IntInput
      v-model="form.duration"
      @input="setTransitionDuration"/>

    <GenericForm v-model="properties" @input="saveProperties"></GenericForm>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./SceneTransitions.vue.ts"></script>

<style lang="less" scoped>
.controls {
  padding-top: 30px;
}
</style>
