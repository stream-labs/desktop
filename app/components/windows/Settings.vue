<template>
<modal-layout
  :title="$t('Settings')"
  :show-cancel="false"
  :done-handler="done">

  <div slot="content" class="settings">
    <NavMenu v-model="categoryName" class="side-menu">
      <NavItem
        v-for="category in categoryNames"
        :key="category"
        :to="category"
        :ico="icons[category]"
      >
        {{ $t(category) }}
      </NavItem>
    </NavMenu>
    <div class="settings-container">
      <extra-settings v-if="categoryName === 'General'" />
      <language-settings v-if="categoryName === 'General'" />
      <hotkeys v-if="categoryName === 'Hotkeys'" />
      <developer-settings v-if="categoryName === 'Developer'" />
      <overlay-settings v-if="categoryName === 'Scene Collections'" />
      <notifications-settings v-if="categoryName === 'Notifications'" />
      <appearance-settings v-if="categoryName === 'Appearance'" />
      <experimental-settings v-if="categoryName === 'Experimental'" />
      <remote-control-settings v-if="categoryName === 'Remote Control'" />
      <GenericFormGroups
        v-if="!['Hotkeys', 'API', 'Overlays', 'Notifications', 'Appearance', 'Experimental', 'Remote Control'].includes(categoryName)"
        v-model="settingsData"
        @input="save" />
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./Settings.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.settings {
  display: flex;
  align-content: stretch;
  align-items: stretch;
  height: 100%;
}

.settings-container {
  flex-grow: 1;
  margin: 0px -20px -20px 0;
  padding-right: 20px;
  overflow: auto;
}
</style>

<style lang="less">
.settings-container {
  .input-container {
    flex-direction: column;

    .input-label,
    .input-wrapper {
      width: 100%;
    }

    .input-label {
      label {
        margin-bottom: 8px;
      }
    }
  }
}
</style>
