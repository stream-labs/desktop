<template>
<div class="section">
  <p>
    If you are experiencing weird behavior, you can try deleting your cache directory.  This will result in you losing your scene configuration and settings, but can fix some stability issues.  The application can not be running when you delete your cache directory.
  </p>
  <button class="button button--action" @click="showCacheDir">
    Show Cache Directory
  </button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import electron from '../vendor/electron';
import { Component } from 'vue-property-decorator';

@Component({})
export default class ExtraSettings extends Vue {

  showCacheDir() {
    electron.remote.shell.showItemInFolder(electron.remote.app.getPath('userData'));
  }

}
</script>
