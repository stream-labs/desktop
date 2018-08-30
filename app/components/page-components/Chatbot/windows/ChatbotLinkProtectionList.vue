<template>
<div>
  <div class="flex flex--end">
    <button @click="onAddingNewItemHandler(null, -1)" class="button button--action">
      {{ $t('Add Link') }}
    </button>
  </div>
  <div
    v-if="value.length === 0"
    class="chatbot-empty-placeholder__container"
  >
    <img
      :src="require(`../../../../../media/images/chatbot/chatbot-placeholder-${type}--${this.nightMode ? 'night' : 'day'}.svg`)"
      width="200"
    />
    {{ $t('No items in list. Add new.') }}
  </div>
  <table v-else>
    <thead>
      <tr>
        <th> {{ $t('Link') }} </th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in value"
        :key="`${item}__${index}`"
      >
        <td> {{ item }} </td>
        <td>
          <div class="align-items--inline">
            <i @click="onAddingNewItemHandler(item, index)" class="icon-edit padding--5" />
            <i @click="onDeleteAliasHandler(index)" class="icon-trash padding--5" />
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <modal
    :name="NEW_LINK_PROTECTION_LIST_MODAL_ID"
    :height="'auto'"
    :maxHeight="300"
  >
    <validated-form @submit.prevent="onAddNewItemHandler" class="new-list-item__container">
      <div class="new-list-item-modal__header">
        <img class="new-list-item-modal__header__icon" src="../../../../../media/images/icon.ico" />
        <div class="new-list-item-modal__header__title">{{ $t(title) }}</div>
      </div>
      <div class="new-list-item-modal__body">
        <TextInput
          class="width--100"
          :metadata="textInputMetadata"
          v-model="newListItem"
        />
      </div>
      <div class="new-list-item-modal__controls">
        <button
          class="button button--default"
          @click="onCancelNewItemModalHandler">
          {{ $t('Cancel') }}
        </button>
        <button
          class="button button--action"
          type="submit"
        >
          {{ $t('Done') }}
        </button>
      </div>
    </validated-form>
  </modal>
</div>
</template>

<script lang="ts" src="./ChatbotLinkProtectionList.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}

tbody tr {

  td:last-child {
    width: 100px;
    .align-items--inline;
    .text-align--right;
    padding-right: 10px;

    .icon-edit {
      font-size: 10px;
      .transition;

      &:hover {
        color: @teal;
      }
    }
  }
}

.new-list-item-modal__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  border-bottom: 1px solid @day-border;

  .new-list-item-modal__header__icon {
    .padding-left();
    width: 32px;
  }

  .new-list-item-modal__header__title {
    .text-transform();
    flex-grow: 1;
    padding-left: 10px;
  }
}

.new-list-item-modal__body {
  .padding--20();
}

.new-list-item-modal__controls {
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

.night-theme {
  .new-list-item-modal__header {
    border-bottom: 1px solid @night-border;
  }

  .new-list-item-modal__controls {
    border-top-color: @night-border;
    background-color: @night-primary;
  }
}

</style>
