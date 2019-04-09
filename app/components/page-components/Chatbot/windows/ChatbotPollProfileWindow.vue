<template>
  <ModalLayout :showControls="false" :customControls="true" :containsTabs="true">
    <div slot="fixed">
      <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
    </div>
    <div slot="content">
      <validated-form ref="form" class="form_content">
        <div class="poll-tabs__general flex__column" v-show="selectedTab === 'general'">
          <div class="section">
            <div class="section-content">
              <VFormGroup
                :title="$t('Title')"
                v-model="newProfile.title"
                :metadata="metaData.title"
              />
            </div>
          </div>
          <div class="section flex--grow">
            <div class="section-content">
              <div class="flex flex--space-between flex--center">
                <h3>{{ $t('Options (min. 2 required)') }}</h3>
                <button
                  class="button button--action margin--10"
                  @click="onAddOptionHandler(null,-1)"
                  :disabled="newProfile.options.length >= 10"
                >{{ $t('Add Option') }}</button>
              </div>
              <table class="options__table-header">
                <thead>
                  <tr>
                    <th>{{$t('#')}}</th>
                    <th>{{ $t('Poll Option') }}</th>
                    <th>{{ $t('Command') }}</th>
                    <th></th>
                  </tr>
                </thead>
              </table>
              <div class="options__table-wrapper">
                <table class="options-table">
                  <tbody>
                    <tr v-for="(profile,index) in newProfile.options" :key="profile.name">
                      <td>{{ index + 1 }}</td>
                      <td>{{ profile.name}}</td>
                      <td>{{ $t(baseCommand) + profile.parameter }}</td>
                      <td class="text-align--right">
                        <i
                          class="icon-trash padding--5 cursor--pointer"
                          @click="onRemoveOptionHandler(index)"
                        />
                        <i
                          class="fas icon-edit chatbot-edit cursor--pointer"
                          @click="onAddOptionHandler(profile, index)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="poll-tabs__advanced" v-show="selectedTab === 'advanced'">
          <div class="section">
            <div class="section-content">
              <div class="flex">
                <BoolInput
                  class="poll-checkbox"
                  :title="$t('Use Timer')"
                  v-model="newProfile.timer.enabled"
                />
                <i class="icon-question icon-btn" v-tooltip="$t('Duration in seconds.')"/>
              </div>
              <VFormGroup v-model="newProfile.timer.duration" :metadata="metaData.duration"/>
              <div class="flex">
                <BoolInput
                  class="poll-checkbox"
                  :title="$t('Send chat notification when voting')"
                  v-model="newProfile.send_notification"
                />
                <i
                  class="icon-question icon-btn"
                  v-tooltip="$t('Notify a viewer that their vote has been registered in chat.')"
                />
              </div>
            </div>
          </div>
        </div>
      </validated-form>
      <ChatbotPollOptionModal
        :option="selectedOption"
        :index="selectedIndex"
        @add="onAddedHandler"
      />
    </div>
    <div slot="controls" class="flex flex--space-between">
      <div></div>
      <div>
        <button class="button button--default" @click="onCancelHandler">{{ $t('Cancel') }}</button>
        <button
          class="button button--action"
          @click="onSaveHandler"
          :disabled="errors.items.length > 0 || newProfile.options.length < 2"
        >{{ $t("Save") }}</button>
      </div>
    </div>
  </ModalLayout>
</template>

<script lang="ts" src="./ChatbotPollProfileWindow.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.section__container {
  height: 100%;
}

.icon-question {
  .icon-hover();
}

.poll-checkbox {
  width: auto;
  margin-right: 10px;
}

.section-content {
  h3 {
    padding-left: 10px;
  }
}

.form_content {
  height: 100%;
}

table {
  table-layout: fixed;
  width: 100%;

  th:nth-child(1),
  td:nth-child(1) {
    width: 50px;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 125px;
  }
}
.options__table-header {
  margin-bottom: 0;
}

.options__table-wrapper {
  overflow-y: auto;
  position: absolute;
  bottom: 56px;
  top: 248px;
  margin-right: 30px;
}

.chatbot-arrow {
  .padding-h-sides();
}

.window-tab {
  &:first-child {
    padding-right: 0;
  }
  &:last-child {
    padding-left: 0;
  }
}

.window-toggle__wrapper {
  background-color: var(--background);
  z-index: 1;
  width: 100%;
  padding: 15px;
  padding-left: 0px;
  height: 48px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}
</style>
