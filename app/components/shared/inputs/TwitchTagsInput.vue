<template>
  <div class="tags-container" data-role="input" data-type="twitchTags" :data-name="name">
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
      <span class="badge badge--new">New</span>
      <span class="message">
        <span>{{ $t('You can now edit your channel tags from this screen.') }}</span>
        <div>{{ $t('Log out and back in to reauthorize additional permissions.') }}</div>
      </span>
    </div>
  </div>
</template>

<script lang="ts" src="./TwitchTagsInput.vue.ts"></script>
