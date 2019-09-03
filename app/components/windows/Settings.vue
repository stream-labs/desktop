<template>
<modal-layout
  :show-cancel="false"
  :done-handler="done"
  class="modal-layout--w-side-menu">

  <div slot="content" class="settings">
    <NavMenu v-model="categoryName">

      <form-input
        v-model="searchStr"
        :metadata="{
          type: 'text',
          placeholder: 'Search',
          icon: 'search'
        }"
        class='search'
       />
      <NavItem
        v-for="category in categoryNames"
        :key="category"
        :to="category"
        :ico="icons[category]"
        :class="{disabled: searchStr && !searchResultPages.includes(category)}"
      >
        {{ $t(category) }}
      </NavItem>
    </NavMenu>

    <searchable-pages
      class="settings-container"
      ref="settingsContainer"
      :page="categoryName"
      :pages="categoryNames"
      :searchStr="searchStr"
      :onBeforePageScan="onBeforePageScanHandler"
      :onPageRender="onPageRenderHandler"
      @searchCompleted="onSearchCompletedHandler"
      @scanCompleted="settingsData = getSettingsData(categoryName)"
      v-slot:default="{ page }"
    >
      <extra-settings v-if="page === 'General'" />
      <language-settings v-if="page === 'General'" />
      <hotkeys v-if="page === 'Hotkeys'" :globalSearchStr="searchStr" :highlightSearch="highlightSearch"/>
      <developer-settings v-if="page === 'Developer'" />
      <installed-apps v-if="page === 'Installed Apps'" />
      <overlay-settings v-if="page === 'Scene Collections'" />
      <notifications-settings v-if="page === 'Notifications'" />
      <appearance-settings v-if="page === 'Appearance'" />
      <experimental-settings v-if="page === 'Experimental'" />
      <remote-control-settings v-if="page === 'Remote Control'" />
      <game-overlay-settings v-if="page === 'Game Overlay'" />
      <facemask-settings v-if="page === 'Facemasks'" />
      <GenericFormGroups
        v-if="!['Hotkeys', 'API', 'Overlays', 'Notifications', 'Appearance', 'Experimental', 'Remote Control'].includes(page)"
        :key="page"
        :categoryName="page"
        v-model="settingsData"
        @input="save" />
    </searchable-pages>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./Settings.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.settings {
  .transition();

  display: flex;
  align-content: stretch;
  align-items: stretch;
  flex: 1;
  margin: -16px;

  .search {
    .margin-left();
    .margin-bottom(2);
  }

  .disabled {
    opacity: 0.2;
  }
}

.settings-container {
  .padding-right(2);
  .padding-top(2);

  flex-grow: 1;
  overflow: auto;
}
</style>

<style lang="less">
.settings-container {
  .input-container,
  .alignable-input {
    flex-direction: column;

    .input-label,
    .input-wrapper,
    .input-body {
      width: 100%;
    }

    .bitmask-input > div {
      width: auto;
    }

    .input-label {
      label {
        margin-bottom: 8px;
        line-height: 16px;
      }
    }
  }
}
</style>
