<template>
<div>
  <div class="section">
    <p>{{ $t('settings.cacheClearDescription')}}</p>
    <div class="margin-bot--20">
      <a class="button button--action" @click="showCacheDir">
        {{ $t('settings.showCacheDirectory')}}
      </a>
      <a class="button button--action" @click="deleteCacheDir">
        {{ $t('settings.deleteCacheAndRestart') }}
      </a>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>
