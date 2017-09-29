<template>
<modal-layout
  title="Scene transition"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-12">
        <ListInput
          v-model="form.type"
          @input="setTransitionType"/>
      </div>
      <div class="columns small-12">
        <IntInput
          v-model="form.duration"
          @input="setTransitionDuration"/>
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./SceneTransitions.vue.ts"></script>

<style lang="less" scoped>
.controls {
  padding-top: 30px;
}
</style>
