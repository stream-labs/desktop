<template>
  <div class="section">
    <table>
      <thead>
        <tr>
          <th> {{ $t('icon') }} </th>
          <th> {{ $t('name')}} </th>
          <th> {{ $t('vers')}} </th>
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
          <td>
            <button
              v-if="isEnabled(app.id)"
              @click="reload(app.id)"
              class="button button--action">Reload</button>
            <button
              v-if="noUnpackedVersionLoaded(app.id)"
              @click="toggleLoad(app)"
              class="button button--default">
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
</style>
