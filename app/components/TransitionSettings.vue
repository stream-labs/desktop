<template>
<div>
  <input-wrapper v-model="nameModel" :metadata="{ title: $t('Name'), type: 'text', name: 'name', fullWidth: true }" />
  <input-wrapper
    v-model="typeModel"
    :metadata="{ title: $t('Type'), type: 'list', name: 'type', options: typeOptions, fullWidth: true }"
  />
  <input-wrapper
    v-show="transition.type !== 'obs_stinger_transition'"
    v-model="durationModel"
    :metadata="{ type: 'number', isInteger: true, title: $t('Duration'), name: 'duration', fullWidth: true }"
  />
  <GenericForm :value="properties" @input="saveProperties"></GenericForm>
</div>
</template>

<script lang="ts" src="./TransitionSettings.vue.ts"></script>
