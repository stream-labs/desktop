<template>
  <div>
    <div class="section">
      <button class="button button--sm button--soft-warning" @click="restoreDefaults">
        Restore Defaults
      </button>
    </div>

    <div class="section">
      <TextInput :value="tokenInput">
        <button
            class="button button--default button--input"
            @click="generateToken">
          Update
        </button>
      </TextInput>
    </div>


    <GenericFormGroups
      v-model="settingsFormData"
      @input="save" />
  </div>
</template>

<script lang="ts" src="./ApiSettings.vue.ts"></script>

