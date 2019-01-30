<template>
<div>
  <v-form-group
    v-model="fromSceneModel"
    :metadata="{ type: 'list', title: $t('Beginning Scene'), name: 'from', options: sceneOptions }"
  />
  <v-form-group
    v-model="transitionModel"
    :metadata="{ type: 'list', title: $t('Scene Transition'), name: 'transition', options: transitionOptions }"
  />
  <v-form-group
    v-model="toSceneModel"
    :metadata="{ type: 'list', title: $t('Ending Scene'), name: 'to', options: sceneOptions }"
  />
</div>
</template>

<script lang="ts" src="./ConnectionSettings.vue.ts"></script>
