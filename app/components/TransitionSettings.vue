<template>
<div>
  <v-form-group v-model="nameModel" :metadata="{ title: $t('Name'), type: 'text', name: 'name' }" />
  <ObsListInput v-model="typeModel"/>
  <ObsIntInput v-model="durationModel"/>

  <GenericForm v-model="properties" @input="saveProperties"></GenericForm>
</div>
</template>

<script lang="ts" src="./TransitionSettings.vue.ts"></script>
