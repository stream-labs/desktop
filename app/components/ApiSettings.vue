<template>
  <div>
    <div class="section">
      <button class="button button--soft-warning" @click="restoreDefaults">
        Restore Defaults
      </button>
    </div>

    <div class="section">
      <ObsTextInput :value="tokenInput">
        <button
            class="button button--default button--input"
            @click="generateToken">
          Update
        </button>
      </ObsTextInput>
    </div>


    <GenericFormGroups
      v-model="settingsFormData"
      category="API"
      @input="save" />
  </div>
</template>

<script lang="ts" src="./ApiSettings.vue.ts"></script>

