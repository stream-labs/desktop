<template>
  <modal-layout
    :done-handler="done"
    :cancel-handler="cancel"
  >

    <div slot="content">
      <v-form-group
        v-model="form.type"
        @input="setTypeAsName"
        :metadata="{ type: 'list', title: $t('Filter type'),  name: 'type', options: typeOptions }"
      />
      <v-form-group v-model="form.name" :metadata="{ type: 'text', title: $t('Filter name'), name: 'name' }" />
      <p v-if="error" style="color: red">
        {{ error }}
      </p>

    </div>

  </modal-layout>
</template>

<script lang="ts" src="./AddSourceFilter.vue.ts"></script>
