<template>
<modal-layout
  :title="$t('common.settings')"
  :show-cancel="false"
  :done-handler="done">

  <div slot="content" class="settings" data-test="Settings">
    <NavMenu v-model="categoryName" class="side-menu" data-test="SideMenu">
      <NavItem
        v-for="category in categoryNames"
        :key="category"
        :to="category"
        :ico="icons[category]"
        :data-test="category"
      >
        {{ $t(`settings.${category}.name`, { fallback: category }) }}
      </NavItem>
    </NavMenu>
    <div class="settings-container">
      <aside class="notice-section" v-if="isStreaming">
        <p class="notice-message">
          <i class="icon-warning"/>{{ $t('settings.noticeWhileStreaming')}}
        </p>
      </aside>
      <extra-settings v-if="categoryName === 'General'" />
      <language-settings v-if="categoryName === 'General'" />
      <hotkeys v-if="categoryName === 'Hotkeys'" />
      <api-settings v-if="categoryName === 'API'" />
      <notifications-settings v-if="categoryName === 'Notifications'" />
      <appearance-settings v-if="categoryName === 'Appearance'" />
      <experimental-settings v-if="categoryName === 'Experimental'" />
      <GenericFormGroups
        v-if="!['Hotkeys', 'API', 'Notifications', 'Appearance', 'Experimental'].includes(categoryName)"
        v-model="settingsData"
        :category="categoryName"
        @input="save" />
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./Settings.vue.ts"></script>

<style lang="less" scoped>
.settings {
  display: flex;
  align-content: stretch;
  align-items: stretch;
  height: 100%;
}

.settings-container {
  flex-grow: 1;
  margin: -20px -20px -20px 0;
  overflow: auto;
}
</style>

<style lang="less">
@import "../../styles/index";
/*配信中に設定ダイアログへ表示するメッセージのstyle*/
.notice-section {
  padding-top: 16px;

  .notice-message {
    color: @accent;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    padding-top: 12px;
  }

  .icon-warning {
    margin-right: 4px;
  }
}

.settings-container {
  .input-container {
    flex-direction: column;

    .input-label, .input-wrapper {
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
