<template>
<modal
  :name="name"
  :height="'auto'"
  :maxHeight="600"
>
  <div class="new-alert-modal">
    <div class="new-alert-modal__header" v-if="title">
      <img class="new-alert-modal__header__icon" src="../../../../../media/images/icon.ico" />
      <div class="new-alert-modal__header__title">{{ title.split('_').join(' ') }}</div>
    </div>
    <validated-form ref="form">
      <div class="new-alert-modal__body">
        <div v-if="isInputModal">
          <VFormGroup
            :title="$t(message)"
            v-model="value"
            :metadata="valueMetaData"
          />
        </div>
        <div v-else>
          <h2 v-if="header">{{ $t(header) }}</h2>
          <p v-if="message">{{ $t(message) }}</p>
        </div>
      </div>
    </validated-form>
    <div class="modal-layout-controls">
      <button v-if="hasCancelListener"
        class="button button--default"
        @click="onEmitHandler('cancel')">
        {{ $t('Cancel') }}
      </button>
      <button v-if="hasNoListener"
        class="button button--default"
        @click="onEmitHandler('no')">
        {{ $t('No') }}
      </button>
      <button v-if="hasOkListener"
        class="button button--action"
        @click="onEmitHandler('ok')">
        {{ $t('Ok') }}
      </button>
      <button v-if="hasYesListener"
        class="button button--action"
        @click="onEmitHandler('yes')">
        {{ $t('Yes') }}
      </button> 
    </div>
  </div>
</modal>
</template>
<script lang="ts" src="./ChatbotGenericModalWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.modal-layout-controls {
  background-color: @day-section;
  .padding-v-sides();
  .padding-h-sides(2);
  .text-align(@right);
  flex-shrink: 0;
  z-index: 10;

  .button {
    .margin-left();
  }
}

.v--modal {
  box-shadow: 0 10px 10px rgba(1,2,2,.15);
}

.night-theme {
  .modal-layout-controls {
    background-color: @night-section;
  }
}

.new-alert-modal {
  .new-alert-modal__header {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 30px;
    border-bottom: 1px solid @day-border;

    .new-alert-modal__header__icon {
      padding-left: 10px;
      width: 32px;
    }

    .new-alert-modal__header__title {
      .text-transform();
      flex-grow: 1;
      padding-left: 10px;
    }
  }

  .new-alert-modal__body {
    .padding--20();
  }

  .new-alert-modal__controls {
    background-color: @day-secondary;
    border-top: 1px solid @day-border;
    padding: 10px 20px;
    text-align: right;
    flex-shrink: 0;
    z-index: 10;

    .button {
      margin-left: 8px;
    }
  }
}


.night-theme {
  .new-alert-modal {
    .new-alert-modal__header {
      border-bottom: 1px solid @night-border;
    }

    .new-alert-modal__controls {
      border-top-color: @night-border;
      background-color: @night-primary;
    }
  }

}


</style>
