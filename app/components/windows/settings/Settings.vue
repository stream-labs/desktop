<template>
  <modal-layout
    :show-cancel="false"
    :done-handler="done"
    class="modal-layout--w-side-menu"
    :contentStyles="{ padding: '0' }"
  >
    <div slot="content" class="settings">
      <NavMenu v-model="categoryName">
        <form-input
          v-model="searchStr"
          :metadata="{
            type: 'text',
            placeholder: 'Search',
            icon: 'search',
          }"
          class="search"
        />
        <button
          class="button button--default clear-search-button"
          v-if="searchStr"
          @click="searchStr = ''"
        >
          <i class="fa fa-times"></i>
        </button>
        <NavItem
          v-for="category in categoryNames"
          :key="category"
          :to="category"
          :ico="icons[category]"
          :class="{ disabled: searchStr && !searchResultPages.includes(category) }"
        >
          {{ $t(category) }}
        </NavItem>
        <NavItem
          v-if="!isPrime"
          key="Prime"
          to="Prime"
          ico="icon-prime"
          :icoStyles="{ color: 'var(--prime)' }"
          :style="{ color: 'var(--prime)' }"
        >
          Prime
        </NavItem>
        <button
          class="settings-auth"
          @click="handleAuth()"
          v-track-click="{
            component: 'Settings',
            target: this.userService.isLoggedIn ? 'logout' : 'login',
          }"
        >
          <i :class="userService.isLoggedIn ? 'fas fa-sign-out-alt' : 'fas fa-sign-in-alt'" />
          {{
            userService.isLoggedIn
              ? $t('Logout %{username}', { username: this.userService.username })
              : $t('Login')
          }}
        </button>
      </NavMenu>

      <scrollable className="settings-container">
        <searchable-pages
          ref="settingsContainer"
          :page="categoryName"
          :pages="categoryNames"
          :searchStr="searchStr"
          :onBeforePageScan="onBeforePageScanHandler"
          :onPageRender="onPageRenderHandler"
          @searchCompleted="onSearchCompletedHandler"
          @scanCompleted="settingsData = getSettingsData(categoryName)"
          v-slot:default="{ page, scanning }"
        >
          <extra-settings v-if="page === 'General'" />
          <language-settings v-if="page === 'General'" />
          <hotkeys
            v-if="page === 'Hotkeys'"
            :globalSearchStr="scanning ? '' : searchStr"
            :highlightSearch="highlightSearch"
          />
          <stream-settings v-if="page === 'Stream'" />
          <developer-settings v-if="page === 'Developer'" />
          <installed-apps v-if="page === 'Installed Apps'" />
          <overlay-settings v-if="page === 'Scene Collections'" />
          <notifications-settings v-if="page === 'Notifications'" />
          <appearance-settings v-if="page === 'Appearance'" />
          <experimental-settings v-if="page === 'Experimental'" />
          <remote-control-settings v-if="page === 'Remote Control'" />
          <game-overlay-settings v-if="page === 'Game Overlay'" />
          <virtual-webcam-settings v-if="page === 'Virtual Webcam'" />
          <facemask-settings v-if="page === 'Face Masks'" />
          <GenericFormGroups
            v-if="
              ![
                'Hotkeys',
                'Stream',
                'API',
                'Overlays',
                'Notifications',
                'Appearance',
                'Experimental',
                'Remote Control',
              ].includes(page)
            "
            :key="page"
            :categoryName="page"
            v-model="settingsData"
            @input="save"
          />
        </searchable-pages>
      </scrollable>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./Settings.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

.settings {
  & /deep/ h2 {
    // reset 'capitalize' transform that works weird when text has a highlight caused by the search
    text-transform: none;
  }

  display: flex;
  align-content: stretch;
  align-items: stretch;
  flex: 1;
  height: 100%;

  .search {
    .margin-left(2);
    .margin-bottom(2);
  }

  .clear-search-button {
    position: absolute;
    left: 188px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    i {
      margin-right: 0;
    }
  }

  .disabled {
    opacity: 0.2;
  }
}

.settings-container {
  .padding-right(2);
  .padding-top(2);

  flex-grow: 1;
}

.settings-auth {
  cursor: pointer;
  border-left: 1px solid transparent;
  padding-left: 24px;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  position: absolute;
  bottom: 0;
  padding-top: 16px;
  padding-bottom: 16px;
  width: 100%;
  border-top: 1px solid var(--border);

  i {
    margin-right: 8px;
  }
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
