<template>
<div>
  <div class="flex flex--end">
    <button @click="onAddingNewItemHandler(null, -1)" class="button button--action">
      {{ $t('Add Word / Phrase') }}
    </button>
  </div>
  <div
    v-if="value.length === 0"
    class="chatbot-empty-placeholder__container"
  >
    <img
      :src="require(`../../../../../media/images/chatbot/chatbot-placeholder-blacklist--${this.nightMode ? 'night' : 'day'}.svg`)"
      width="200"
    />
    {{ $t('No items in list. Add new.') }}
  </div>
  <table v-else>
    <thead>
      <tr>
        <th> {{ $t('Word') }} </th>
        <th> {{ $t('Punishment') }} </th>
        <th> {{ $t('Duration (Value in Minutes).') }} </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in value"
        :key="`${item}__${index}`"
      >
        <td> {{ item.text }} </td>
        <td> {{ $t(item.punishment.type) }} </td>
        <td> {{ item.punishment.type === 'Timeout' ? item.punishment.duration : '-' }} </td>
        <td>
          <div class="align-items--inline">
            <i @click="onDeleteAliasHandler(index)" class="icon-trash padding--5" />
            <i @click="onAddingNewItemHandler(item, index)" class="icon-edit padding--5" />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <modal
    :name="NEW_WORD_PROTECTION_LIST_MODAL_ID"
    :height="'auto'"
    :maxHeight="300"
  >
    <div class="new-list-item__container">
      <div class="new-list-item-modal__header">
        <img class="new-list-item-modal__header__icon" src="../../../../../media/images/icon.ico" />
        <div class="new-list-item-modal__header__title">{{ $t('Add to Blacklist') }}</div>
      </div>
      <div class="new-list-item-modal__body">
        <div class="row">
          <div class="small-7 columns">
            <VFormGroup
              :title="$t('Word or Phrase')"
              :metadata="metadata.text"
              v-model="newListItem.text"
            />
          </div>
          <div class="small-5 columns">
            <VFormGroup
              :title="$t('Punishment')"
              v-model="newListItem.punishment.type"
              :metadata="metadata.punishment.type"
            />
          </div>
        </div>
        <VFormGroup
          v-if="newListItem.punishment.type === 'Timeout'"
          :title="$t('Punishment Duration (Value in Minutes)')"
          v-model="newListItem.punishment.duration"
          :metadata="metadata.punishment.duration"
        />
        <BoolInput
          class="margin-top--10"
          :title="$t('This word contains Regular Expression')"
          v-model="newListItem.is_regex"
          :metadata="metadata.is_regex"
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
          @click="onAddNewItemHandler"
          :disabled="errors.items.length > 0 || !newListItem.text"
        >
          {{ $t('Done') }}
        </button>
      </div>
    </div>
  </modal>
</div>
</template>

<script lang="ts" src="./ChatbotWordProtectionList.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}
tbody tr {

  td {
    color: black;
  }

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
    padding-left: 10px;
    width: 32px;
  }

  .new-list-item-modal__header__title {
    .text-transform();
    flex-grow: 1;
    .padding-left();
  }
}

.new-list-item-modal__body {
  .padding--20();
}

.new-list-item-modal__controls {
  background-color: @day-section;
  border-top: 1px solid @day-border;
  padding: 8px 16px;
  text-align: right;
  flex-shrink: 0;
  z-index: 10;

  .button {
    margin-left: 8px;
  }
}

.night-theme {
  tbody tr {
    border: 2px solid transparent;
    .transition();
    .cursor--pointer;
    color: white;
    td {
      color: white;
    }
  }
  tbody tr:nth-child(odd) {
    background-color: @navy-secondary;
  }
  tbody tr:nth-child(even) {
    background-color: @navy;
  }

  .new-list-item-modal__header {
    border-bottom: 1px solid @night-border;
  }

  .new-list-item-modal__controls {
    border-top-color: @night-border;
    background-color: @night-primary;
  }
}

</style>
