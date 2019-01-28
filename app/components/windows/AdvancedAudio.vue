<template>
<modal-layout
  :show-controls="false"
>

  <div slot="content">


    <table>
      <thead>
        <tr>
          <th>{{ $t('Name') }}</th>
          <th>{{ $t('Volume ( % )') }}</th>
          <th>{{ $t('Downmix to Mono') }}</th>
          <th>{{ $t('Sync Offset ( ms )') }}</th>
          <th>{{ $t('Audio Monitoring') }}</th>
          <th>{{ $t('Tracks') }}</th>
        </tr>
      </thead>

      <tr v-for="audioSource in audioSources" :key="audioSource.name">
        <td>{{ audioSource.name }}</td>
        <td
          v-for="formInput in audioSource.getSettingsForm()"
          :key="`${audioSource.name}${formInput.name}`"
          :class="'column-' + formInput.name"
        >
          <div class="advanced-audio-input">
            <component
                v-if="propertyComponentForType(formInput.type)"
                :is="propertyComponentForType(formInput.type)"
                :value="formInput"
                @input="value => onInputHandler(audioSource, formInput.name, value.value)"
            />
          </div>
        </td>
      </tr>

    </table>

  </div>

</modal-layout>
</template>

<script lang="ts" src="./AdvancedAudio.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.column-deflection {
  width: 120px;
}

tr {
  td {
    &:nth-child(1) {
      white-space: nowrap;
    }
  }
}

.advanced-audio-input {
  .alignable-input {
    margin-bottom: 0;
  }
  .alignable-input /deep/ .input-body {
    width: 100%;
  }
}
</style>
