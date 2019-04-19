<template id="pane__dropdown__template">
  <div>
    <div class="permission-label">
      <label>{{$t('Permission')}}</label>
    </div>

    <div class="pane-dropdown--marketplace" ref="paneMenu">
      <a
        class="pane-dropdown__toggle"
        :class="{ 'pane-dropdown__toggle--active': paneMenuOpen }"
        @click="toggleDropDown"
        ref="toggle"
      >
        <span class="flex flex--space-between width--100">
          <span>{{text}}</span>
          <i class="fas fa-chevron-down"></i>
        </span>
      </a>

      <div class="pane-dropdown__menu" v-show="paneMenuOpen" ref="menu">
        <div>
          <ul class="pane-dropdown__list">
            <li>
              <BoolInput :title="$t('Regulars')" v-model="checkboxes.regular.checked"/>
            </li>
            <li>
              <BoolInput :title="$t('Subscribers')" v-model="checkboxes.subscriber.checked"/>
            </li>
            <li>
              <BoolInput :title="$t('Moderators')" v-model="checkboxes.moderator.checked"/>
            </li>
            <li>
              <BoolInput :title="$t('Streamer')" v-model="checkboxes.streamer.checked"/>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" src="./ChatbotPermissions.vue.ts"></script>

<style lang="less">
@import '../../../../styles/index';
.permission-label {
  .margin-bottom();
}

.pane-dropdown--marketplace {
  background-color: var(--dropdown-bg);
  .margin-bottom(2);
  .radius();

  .pane-dropdown__toggle {
    text-transform: capitalize;
    background-color: var(--dropdown-bg);
    border-color: var(--focus-border);
    border-style: solid;
    border-width: 1px;
    font-size: 14px;
    height: 32px;
    display: flex;
    padding: 4px 8px;
    color: var(--paragraph);
    .radius();

    .fa-chevron-down,
    .fa-caret-down {
      color: var(--paragraph);
      font-weight: 900;
      font-size: 9px;
      margin-top: 6px;
      margin-right: 0px;
    }

    span {
      font-weight: normal;
    }
  }

  .pane-dropdown__menu {
    position:absolute;
    padding: 0;
    margin: 0;
    margin-top: 0;
    text-align: left;
    list-style-type: none;
    z-index: 100;
    .radius();
    .shadow();
    width: auto;
    max-height: 300px;
    left: 15px;
    background-color: var(--dropdown-bg);
    width: 95%;

    &.active {
      display: block;
    }
  }

  .pane-dropdown__list {
    width: 100%;
    .margin-top();
    .margin-bottom();
    margin-left: 0;
    margin-right: 0;
    list-style-type: none;

    li:hover,
    li:focus {
      background: var(--focus-border);
    }

    .input-wrapper {
      width: 100%;

      .margin-left();
      cursor: pointer;
    }

    .checkbox {
      margin-bottom: 0;
      .padding-top(1);
      .padding-bottom(1);
    }
    label {
      cursor: pointer;
    }
  }
}
.chatbot-aliases__container {
  .chatbot-aliases__new-alias__button {
    .text-transform();
    .width--100();
  }

  .chatbot-aliases__aliases_wrapper {
    .align-items--inline;
    .margin-top();
  }
  .chatbot-aliases__alias {
    margin-right: 10px;
    padding: 6px 12px;
    background-color: var(--teal);
    border-radius: 20px;
    color: white;
    cursor: pointer;

    .chatbot-aliases__alias__close-icon {
      margin-right: 4px;
      font-size: 10px;
    }
  }
}
</style>
