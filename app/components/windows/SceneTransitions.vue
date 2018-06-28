<template>
<modal-layout
  :title="$t('Scene Transitions')"
  :done-handler="done">

  <div slot="content">
    <button class="button button--action" @click="addTransition">
      {{$t('Add Transition')}}
    </button>
    <ul v-for="transition in transitions" :key="transition.id">
      <li>
        {{ transition.name }}
        <button @click="editTransition(transition.id)">Edit</button>
        <button @click="deleteTransition(transition.id)">Delete</button>
        <span v-if="defaultTransitionId === transition.id">[IS DEFAULT]</span>
        <button v-else @click="makeDefault(transition.id)">Make Default</button>
      </li>
    </ul>
    <modal name="settings" :height="550">
      <div class="transition-settings-modal">
        <transition-settings :transition-id="inspectedId"/>
      </div>
    </modal>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./SceneTransitions.vue.ts"></script>

<style lang="less" scoped>
.controls {
  padding-top: 30px;
}

.transition-settings-modal {
  padding: 20px;
}
</style>
