<template>
  <modal :name="MODAL_NAME" :height="'auto'" :maxHeight="600">
    <div class="item__container">
      <div class="item-modal__body">
        <h2>Desktop Streamlabs Chatbot Instructions</h2>
        <span>{{$t('In order to import your data from our Desktop Chatbot you will need to follow these steps:')}}</span>
        <ul>
          <li>{{$t('Open up your Streamlabs Chatbot')}}</li>
          <li>
            {{$t('Click on')}}
            <i class="icon-user"></i>
            {{$t('to open the connections window')}}
          </li>
          <li>{{$t('Click on the Streamlabs')}}</li>
          <li>{{$t('Make sure your Streamlabs Account is connected')}}</li>
          <li>{{$t('Click on "Open Desktop to Cloudbot Exporter" to launch the exporter window')}}</li>
          <li>{{$t('Select which data you wish to export')}}</li>
          <li>{{$t('Click Export and wait for the bar to fill completely')}}</li>
        </ul>
      </div>
      <div class="item-modal__controls">
        <button class="button button--action" @click="$modal.hide(MODAL_NAME)">{{ $t('Ok') }}</button>
      </div>
    </div>
  </modal>
</template>
<script lang="ts" src="./DesktopInstructionsModal.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.item-modal__body {
  .padding--20();
}

.item-modal__controls {
  background-color: var(--section);
  border-top: 1px solid var(--dropdown-border);
  padding: 8px 16px;
  text-align: right;
  flex-shrink: 0;
  z-index: 10;

  .button {
    margin-left: 8px;
  }
}
</style>
