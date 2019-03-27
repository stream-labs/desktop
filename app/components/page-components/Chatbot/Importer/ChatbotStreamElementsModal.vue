<template>
  <modal :name="MODAL_NAME" :height="'auto'" :maxHeight="600">
    <div class="item__container">
      <div class="item-modal__body">
        <h2>StreamElements Importer</h2>
        <span>
          {{$t('In order to import your data from StreamElements you need to provide your JWT Token. This token can be found over')}}
          <span
            class="here-button"
            @click="openSEDashboard"
          >{{$t('here')}}</span>
          {{$t(', to reveal your JWT Token click on the Show Secrets switch.')}}
        </span>
        <validated-form class="form__container" ref="modalForm">
          <VFormGroup
            :title="$t('StreamElements JWT Token')"
            v-model="token"
            :metadata="tokenMetaData"
          />

          <BoolInput :title="$t('Commands')" v-model="importCommands"/>
          <BoolInput :title="$t('Timers')" v-model="importTimers"/>
          <BoolInput :title="$t('Loyalty')" v-model="importLoyalty"/>
        </validated-form>
      </div>
      <div class="item-modal__controls">
        <button class="button button--default" @click="cancelHandler">{{ $t('Cancel') }}</button>
        <button
          class="button button--action"
          :disabled="errors.items.length > 0"
          @click="continueHandler"
        >{{ $t('Continue') }}</button>
      </div>
    </div>
  </modal>
</template>
<script lang="ts" src="./ChatbotStreamElementsModal.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.item-modal__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  border-bottom: 1px solid var(--border);

  .item-modal__header__icon {
    padding-left: 10px;
    width: 32px;
  }

  .item-modal__header__title {
    .text-transform();
    flex-grow: 1;
    .padding-left();
  }
}

.command-span {
  .margin-right();
}

.item-modal__body {
  .padding--20();
}

.form__container {
  .margin-top();
}

.item-modal__controls {
  background-color: var(--section);
  border-top: 1px solid var(--border);
  padding: 8px 16px;
  text-align: right;
  flex-shrink: 0;
  z-index: 10;

  .button {
    margin-left: 8px;
  }
}

.here-button {
  font-weight: 500;
  text-decoration: underline;
  .cursor--pointer();
}
</style>
