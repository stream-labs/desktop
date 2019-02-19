<template>
<modal-layout
  :showControls="false"
  :title="$t('audio.advancedAudioSettings')">

  <div slot="content">
    <table>
      <tr>
        <th class="device">{{ $t('common.name') }}</th>
        <th class="volume">{{ $t('audio.volumeInPercent') }}</th>
        <th class="downmix">{{ $t('audio.downmixToMono') }}</th>
        <th class="syncOffset">{{ $t('audio.syncOffsetInMs') }}</th>
        <th class="audioMonitor">{{ $t('audio.audioMonitoring') }}</th>
        <th class="track">{{ $t('audio.tracks') }}</th>
      </tr>

      <tr v-for="audioSource in audioSources" :key="audioSource.sourceId">
        <td>{{ audioSource.name }}</td>
        <td v-for="formInput in audioSource.getSettingsForm()" :class="'column-' + formInput.name" :key="formInput.name">
          <component
              v-if="propertyComponentForType(formInput.type)"
              :is="propertyComponentForType(formInput.type)"
              :value="formInput"
              @input="value => onInputHandler(audioSource, formInput.name, value.value)"
          />
        </td>
      </tr>

    </table>

  </div>

</modal-layout>
</template>

<script lang="ts" src="./AdvancedAudio.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";

table {
  min-width: 1060px;
}

.volume {}
.device {
  width: 150px;
}
.downmix {
  width: 120px;
}
.syncOffset {}
.audioMonitor {}
.track {}

.device,
.volume,
.downmix,
.syncOffset,
.audioMonitor,
.track {
  color: @text-secondary;
  text-align: center;
}

tr {
  td {
    &:nth-child(1) {
      white-space: nowrap;
    }
  }
}

th,
td {
  text-align: left;
}

.column-deflection {
  width: 80px;
}
.column-syncOffset {
  width: 100px;
}
.column-monitoringType {
  width: 260px;
}
</style>
