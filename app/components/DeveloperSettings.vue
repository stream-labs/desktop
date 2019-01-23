<template>
  <div>
    <div v-if="appDeveloperMode" class="section">
      <AppPlatformDeveloperSettings />
    </div>

    <div class="section">
      <button class="button button--soft-warning" @click="restoreDefaults">
        Restore Defaults
      </button>
    </div>

    <div class="section">
      <div class="section-content">
        <v-form-group :title="$t('API Token')">
          <text-input :value="tokenInput" :metadata="{ masked: true }">
            <button
                class="button button--default"
                @click="generateToken">
              Update
            </button>
          </text-input>
        </v-form-group>
      </div>
    </div>


    <GenericFormGroups
      v-model="settingsFormData"
      @input="save" />
  </div>
</template>

<script lang="ts" src="./DeveloperSettings.vue.ts"></script>

