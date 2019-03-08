<template>
  <div class="tags-container">
    <label class="input-label">{{ tagsLabel }}</label>
    <v-selectpage
      v-if="hasPermission"
      :data="options"
      :multiple="true"
      key-field="tag_id"
      show-field="name"
      :pagination="false"
      :title="tagsLabel"
      :placeholder="selectPlaceholder"
      v-model="currentTags"
      :tb-columns="tableColumns"
      :max-select-limit="5"
      @values="onInput"
      language="en"
      :width="398"
      :disabled="shouldDisable"
    />

    <div class="update-tags-notice" v-else>
      <span class="badge badge--new">{{ $t('New') }}</span>
      <span class="message">
        <span>{{ $t('You can now edit your channel tags from this screen.') }}</span>
        <div>{{ $t('Log out and back in to reauthorize additional permissions.') }}</div>
      </span>
    </div>
  </div>
</template>

<script lang="ts" src="./TwitchTagsInput.vue.ts"></script>

<style lang="less">
@import '../../../styles/index';
@import '../../../styles/badges';

.tags-container {
  flex-direction: row;
  flex: 1;
  display: flex;
  margin-bottom: 8px;
}

.v-selectpage,
.v-dropdown-container,
.sp-result-message,
.sp-message {
  font-family: 'Roboto' !important;
}

.v-selectpage {
  width: 70%;
}

.update-tags-notice {
  width: 70%;

  .badge.badge--new {
    margin-left: 0;
  }
}

table.sp-table {
  font-family: 'Roboto' !important;

  // Tag descriptions
  tbody tr td:nth-child(2) {
    font-size: 12px;
    line-height: 14px;
    text-align: justify;
  }
}

.sp-base.sp-inputs {
  background: var(--dropdown-bg) !important;
  border-color: var(--dropdown-border) !important;
}

& + .v-dropdown-container {
  background-color: var(--dropdown-bg);
  border-color: var(--dropdown-border);
  color: var(--paragraph);

  .sp-table {
    color: var(--paragraph);
  }

  .sp-search .sp-search-input {
    background: var(--input-bg);
    color: var(--paragraph);
    border-color: var(--input-border);
  }

  .sp-result-area,
  .sp-search,
  .night-theme .sp-result-area,
  .night-theme .sp-search {
    background-color: var(--dropdown-bg) !important;
    border-color: var(--input-border) !important;
  }

  tbody tr:nth-child(odd) {
    background-color: var(--dropdown-alt-bg);
  }
}

.sp-selected-tag {
  background-color: @teal !important;
  box-shadow: none !important;
  border: none !important;
}

.sp-header button {
  display: none;
}

.sp-placeholder {
  margin-left: 4px !important;
}

.sp-selected {
  opacity: 0.5;
}

.sp-selected-tag span:first-child {
  padding: 0 8px !important;
}

.sp-caret {
  border: 0px !important;
  padding: 0 !important;
  top: 33% !important;
  right: 9px !important;
  // Match multiselect style
  &::before {
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    content: '\F078';
    border: none;
    font-size: 9px;
    position: absolute;
    right: 2px;
    top: 2px;
  }
}
.sp-iconfont.sp-icon-close {
  font-family: 'icomoon' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  font-size: 12px !important;
  position: relative;
  top: 1px;

  &::before {
    content: '\e956' !important;
  }
}

.sp-iconfont.sp-icon-close {
  color: var(--link) !important;

  &:hover {
    color: var(--link-active) !important;
  }
}

// Disable the arrow button transform, it's a nice animation but we're matching list input styles
.sp-button.open .sp-caret {
  transform: none !important;
}

.sp-search .sp-search-input:focus {
  box-shadow: none !important;
}

// Kill the header, we don't see much use for it right now
.sp-header {
  display: none;
}

.sp-table th {
  background-color: transparent !important;
}

.sp-result-area::-webkit-scrollbar {
  // TODO: add scrollbars back, personally I think it looks nice without it
  // but since list inputs have them, consider adding for consistency.
  display: none;
}

.sp-selected-tag {
  color: @white !important;
}

// HACK: specificity hack for the hover color for options
div.sp-result-area table.sp-table tbody tr.sp-over td {
  &:nth-child(1),
  &:nth-child(2) {
    background-color: @teal !important;
  }
}

.input-label {
  width: 30%;
  .padding-right(2);
}
</style>
