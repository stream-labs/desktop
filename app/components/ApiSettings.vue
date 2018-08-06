<template>
  <div>
    <div class="section">
      <div class="section-content">
        <button class="button button--soft-warning" @click="restoreDefaults">
          Restore Defaults
        </button>
      </div>
    </div>

    <div class="section">
      <div class="section-content">
        <ObsTextInput :value="tokenInput">
          <button
              class="button button--default button--input"
              @click="generateToken">
            Update
          </button>
        </ObsTextInput>
      </div>
    </div>


    <GenericFormGroups
      v-model="settingsFormData"
      @input="save" />
  </div>
</template>

<script lang="ts" src="./ApiSettings.vue.ts"></script>

