<template>
  <div class="section">
    <table style="width: 100%">
      <thead>
        <tr>
          <th> {{ $t('Icon') }} </th>
          <th> {{ $t('Name')}} </th>
          <th> {{ $t('Vers')}} </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="app in installedApps"
          :key="app.id"
        >
          <td> <img :src="app.icon" alt="-" width='50'> </td>
          <td> {{ app.manifest.name }} </td>
          <td> {{ app.manifest.version }} </td>
          <td class="button-container button-container--right">
            <button
              v-if="isEnabled(app.id)"
              @click="reload(app.id)"
              class="button button--trans"><i class="icon-reset"></i>{{ $t('Reload') }}</button>
            <button
              v-if="noUnpackedVersionLoaded(app.id)"
              @click="toggleEnable(app)"
              class="button"
              :class="{ 'button--soft-warning': isEnabled(app.id), 'button--default': !isEnabled(app.id) }">
              {{ isEnabled(app.id) ? 'Disable' : 'Enable' }}
            </button>
            <div v-else>
              <button
                disabled
                class="button button--default">
                {{ $t('Unpacked vers loaded') }}
              </button>
              <i
                v-tooltip.left=" $t('You must unload unpacked version before enabling this app.') "
                class="icon-question"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" src="./InstalledApps.vue.ts"></script>

<style lang="less" scoped>
table td:last-child {
  text-align: right;
}

.button-container {
  .button {
    margin-right: 0;
  }
}
</style>
