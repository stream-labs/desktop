<template>
<div>
  <TextInput v-model="nameModel"/>
  <ListInput v-model="typeModel"/>
  <IntInput v-model="durationModel"/>

  <GenericForm v-model="properties" @input="saveProperties"></GenericForm>
</div>
</template>

<script lang="ts" src="./TransitionSettings.vue.ts"></script>
