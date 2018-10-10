<template>
  <div>
    <table>
      <thead>
        <tr>
          <th> {{ $t('name')}} </th>
          <th> {{ $t('version')}} </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="app in installedApps"
          :key="app.id"
        >
          <td> {{ app.manifest.name }} </td>
          <td> {{ app.manifest.version }} </td>
          <td>
            <button @click="reload(app.id)" class="button button--action">Reload</button>
            <button @click="toggleEnable(app.id)" class="button button--default">
              {{ app.enabled ? 'Disable' : 'Enable' }}
            </button>
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
